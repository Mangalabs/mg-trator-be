# 🔔 Sistema de Notificações Automáticas

Sistema automatizado de verificação de estoque e envio de notificações push.

## ⏰ Funcionamento

### Verificação Automática

- **Frequência**: A cada 30 minutos
- **Início**: 5 segundos após o servidor iniciar
- **Cron**: `*/30 * * * *`

### Limite de Notificações

- **Máximo por produto**: 2 notificações por dia
- **Intervalo mínimo**: 12 horas entre notificações
- **Anti-spam**: Se notificou há menos de 1 hora, não notifica novamente

## 📊 Níveis de Alerta

### 🔴 Estoque CRÍTICO

- Quando: estoque ≤ 30% do mínimo
- Exemplo: Mínimo 10, crítico se ≤ 3 unidades
- Notificação: "🔴 Estoque CRÍTICO"

### 🟡 Estoque BAIXO

- Quando: estoque ≤ 80% do mínimo
- Exemplo: Mínimo 10, baixo se ≤ 8 unidades
- Notificação: "🟡 Estoque BAIXO"

## 🎯 Critérios para Notificação

Um produto só recebe notificação se:

1. ✅ `notifications_enabled = true`
2. ✅ Tem estoque mínimo configurado (`min > 0`)
3. ✅ Estoque atual ≤ 80% do mínimo
4. ✅ Ainda não atingiu limite de 2 notificações no dia
5. ✅ Passou pelo menos 12 horas desde a última notificação

## 🚀 Endpoints

### POST /stock-monitor/check

Aciona verificação manual de todos os produtos.

**Resposta de sucesso:**

```json
{
  "message": "Verificação de estoque concluída",
  "success": true,
  "results": {
    "checked": 2,
    "notifications_sent": 1,
    "errors": 0,
    "skipped": 0
  }
}
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
CLICK_API_URL=https://api.gestaoclick.com/api
CLICK_API_ACCESS_TOKEN=seu_token_aqui
CLICK_API_PRIVATE_TOKEN=seu_token_secreto
```

### Firebase

O sistema usa Firebase Cloud Messaging (FCM) para enviar notificações.

- Cada produto tem um tópico: `product_{id}`
- Usuários se inscrevem automaticamente ao ativar notificações

## 📝 Logs

### Exemplos de Logs

**Verificação normal:**

```
⏰ Cron: Iniciando verificação automática de estoque...
🔍 Iniciando verificação de estoque...
📦 2 produtos com notificações ativadas
✅ Produto 14622355: Estoque OK (21/10)
✅ Produto 11100354: Estoque OK (155/20)
✅ Verificação concluída: { checked: 2, notifications_sent: 0, errors: 0, skipped: 0 }
```

**Com notificação:**

```
⏰ Cron: Iniciando verificação automática de estoque...
🔍 Iniciando verificação de estoque...
📦 2 produtos com notificações ativadas
🔔 Notificação enviada para produto 14622355 (CRÍTICO)
✅ Produto 11100354: Estoque OK (155/20)
✅ Verificação concluída: { checked: 2, notifications_sent: 1, errors: 0, skipped: 0 }
```

**Atingiu limite diário:**

```
⏰ Cron: Iniciando verificação automática de estoque...
🔍 Iniciando verificação de estoque...
📦 2 produtos com notificações ativadas
⏭️  Produto 14622355 já foi notificado 2x hoje, pulando...
✅ Produto 11100354: Estoque OK (155/20)
✅ Verificação concluída: { checked: 1, notifications_sent: 0, errors: 0, skipped: 1 }
```

## 🧪 Testar Manualmente

### Via curl:

```bash
curl -X POST http://localhost:3000/stock-monitor/check
```

### Via navegador (produção):

```bash
curl -X POST http://37.59.103.70:3000/stock-monitor/check
```

## 📱 Formato da Notificação

### Notificação Push

```json
{
  "notification": {
    "title": "🔴 Estoque CRÍTICO",
    "body": "FILTRO SEPARADOR DE ÁGUA RHINO\nEstoque: 2 unidades (mínimo: 10)"
  },
  "data": {
    "type": "low_stock",
    "productId": "1",
    "barcode": "14622355",
    "currentStock": "2",
    "minStock": "10",
    "level": "CRÍTICO"
  }
}
```

## 🗄️ Banco de Dados

### Tabela product

```sql
- id: ID único do produto
- barcode: Código de barras
- name: Nome do produto
- min: Estoque mínimo
- click_id: ID na API Gestão Click
- notifications_enabled: Boolean (true/false)
- last_notification_at: Timestamp da última notificação
```

### Consultar produtos com notificações:

```sql
SELECT id, barcode, name, min, click_id, notifications_enabled, last_notification_at
FROM product
WHERE notifications_enabled = true
ORDER BY id;
```

## 🚀 Deploy

Após fazer alterações:

1. Commit e push:

```bash
git add -A
git commit -m "feat: alteração no sistema de notificações"
git push
```

2. Deploy no OVH:

```bash
./deploy-quick.sh
```

Ou manualmente:

```bash
ssh debian@vps-e6270121.vps.ovh.net
cd ~/mg-trator-be
git pull
docker compose build api
docker compose up -d api
docker compose logs api --tail=50
```

## 📊 Monitoramento

### Ver logs do cron:

```bash
docker compose logs api | grep -i "cron\|notificação\|verificação"
```

### Ver status dos containers:

```bash
docker compose ps
```

### Verificar última execução:

```bash
docker compose logs api --tail=100 | grep "Verificação concluída"
```

## ⚠️ Troubleshooting

### Notificações não estão sendo enviadas

1. Verificar se cron está ativo:

```bash
docker compose logs api | grep "Cron de notificações iniciado"
```

2. Verificar produtos com notificações ativadas:

```bash
docker exec mg-trator-db psql -U mg_admin -d mg_trator_prod -c \
  "SELECT id, barcode, notifications_enabled FROM product;"
```

3. Testar manualmente:

```bash
curl -X POST http://37.59.103.70:3000/stock-monitor/check
```

### Erro de conexão com API Click

- Verificar tokens no `.env.docker`
- Testar API Click diretamente:

```bash
curl "https://api.gestaoclick.com/api/produtos?codigo=14622355" \
  -H "access-token: SEU_TOKEN" \
  -H "secret-access-token: SEU_TOKEN_SECRETO"
```

## 🎉 Resumo

✅ Verificação automática a cada 30 minutos
✅ Máximo 2 notificações por produto por dia  
✅ Integração com Gestão Click API
✅ Suporte a produtos com múltiplas variações
✅ Sistema anti-spam integrado
✅ Logs detalhados para troubleshooting
