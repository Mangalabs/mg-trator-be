# 📱 Guia de Teste End-to-End - MG Estoque

## ✅ **Status Atual:**

- ✅ Backend rodando na porta 3000
- ✅ 5 produtos no banco de dados
- ✅ Cron configurado (executa a cada 15min)
- ✅ Firebase Admin inicializado
- ✅ Notificação de teste enviada com sucesso

---

## 🧪 **Como Testar:**

### **1. Verificar Backend**

```bash
cd /home/gabriel/Documentos/mg-app/mg-trator-be
npm run dev
```

Deve exibir:

```
Firebase inicializado
🕐 Cron de notificações iniciado (*/15 * * * *)
Server listening on port 3000
```

---

### **2. Testar API Manualmente**

```bash
# Listar produtos
curl http://localhost:3000/product | jq '.'

# Buscar por barcode
curl http://localhost:3000/product/barcode?barcode=7891234567890 | jq '.'

# Buscar por ID
curl http://localhost:3000/product/id?id=1 | jq '.'
```

---

### **3. Enviar Notificação de Teste**

```bash
cd /home/gabriel/Documentos/mg-app/mg-trator-be
node test-notification.js
```

**Resultado esperado:**

- ✅ Console: "✅ Notificação enviada com sucesso!"
- ✅ Dispositivo/Emulador: Notificação aparece na barra superior
- ✅ Título: "🔔 Teste de Estoque Baixo"
- ✅ Mensagem: "Produto 7891234567890 está com 3 unidades (mínimo: 10)"

---

### **4. Testar App React Native**

#### **4.1. Iniciar App**

```bash
cd /home/gabriel/Documentos/mg-app/MGTratorApp
npm start
```

Em outro terminal:

```bash
npm run android
```

#### **4.2. O que deve acontecer:**

1. **Ao abrir o app:**

   - ✅ Solicita permissão de notificações (se primeira vez)
   - ✅ Registra FCM token no backend
   - ✅ Log no console: "✅ Token FCM registrado no backend"

2. **Na tela principal:**

   - ✅ Carrega 5 produtos do backend
   - ✅ Mostra nome, código de barras, estoque atual e mínimo
   - ✅ Cards coloridos (vermelho para estoque baixo)

3. **Pull-to-refresh:**

   - ✅ Puxe a lista para baixo
   - ✅ Dados recarregam do backend

4. **Busca:**

   - ✅ Digite no campo de busca
   - ✅ Filtra produtos por nome ou código

5. **Filtro "Estoque Baixo":**
   - ✅ Clique no botão "Estoque Baixo"
   - ✅ Mostra apenas produtos com estoque <= mínimo

#### **4.3. Receber Notificações**

Com o app **ABERTO**:

```bash
cd /home/gabriel/Documentos/mg-app/mg-trator-be
node test-notification.js
```

**Resultado esperado:**

- ✅ Notificação aparece no topo do app
- ✅ Log no Metro: "📱 Notificação recebida em foreground"

Com o app **EM BACKGROUND** (minimizado):

```bash
node test-notification.js
```

**Resultado esperado:**

- ✅ Notificação aparece na barra de status do Android
- ✅ Som/vibração (se configurado)
- ✅ Ao clicar, abre o app

---

### **5. Testar Cron Automático**

O cron executa **automaticamente a cada 15 minutos**.

Para testar:

1. Deixe o backend rodando
2. Aguarde até a próxima execução do cron
3. Veja os logs no terminal do backend:

```
⏰ Cron: Verificando produtos com estoque baixo...
📦 5 produtos cadastrados para monitorar
🔔 Estoque baixo detectado: 7891234567890 (3/10)
✅ Notificação enviada para produto 7891234567890
✅ Cron: Verificação concluída
```

**Observações:**

- Notificações só são enviadas se passaram 24h da última
- Campo `last_notification_at` controla o cooldown
- Estoque atual é simulado (random) - TODO: integrar com API Click

---

## 🔍 **Troubleshooting:**

### **Notificação não aparece no app:**

1. Verifique permissões: Configurações > Apps > MG Estoque > Notificações
2. Confirme que FCM token foi registrado (veja logs do app)
3. Teste com app em foreground primeiro

### **App não conecta com backend:**

1. Backend está rodando? `curl http://localhost:3000/product`
2. Android emulator usa `10.0.2.2` (já configurado no ApiService)
3. Verifique logs do Metro bundler

### **Erro ao enviar notificação:**

1. Arquivo `mg-estoque-cf281-firebase-adminsdk-fbsvc-1956314217.json` existe?
2. Firebase Admin inicializado? Veja logs do backend
3. Token FCM válido? Teste com `node test-notification.js`

---

## 📊 **Endpoints da API:**

| Método | Endpoint                     | Descrição                     |
| ------ | ---------------------------- | ----------------------------- |
| GET    | `/product`                   | Lista todos os produtos       |
| GET    | `/product/barcode?barcode=X` | Busca por código de barras    |
| GET    | `/product/id?id=X`           | Busca por ID                  |
| POST   | `/product/sync`              | Sincroniza produtos           |
| POST   | `/messaging/subscribe`       | Inscreve FCM token em tópicos |

---

## 🎯 **Próximos Passos:**

1. **Integrar API Click** (externa) para obter estoque real

   - Configurar `CLICK_API_PRIVATE_TOKEN` no `.env`
   - Atualizar URL se necessário

2. **Testar em produção:**

   - Deploy backend (Heroku, Railway, etc.)
   - Atualizar `API_BASE_URL` no app
   - Gerar APK de release

3. **Melhorias:**
   - Tela de detalhes do produto
   - Histórico de notificações
   - Configurar frequência de verificação
   - Gráficos de estoque

---

## ✅ **Checklist de Testes:**

- [ ] Backend inicia sem erros
- [ ] Produtos carregam no banco (5 produtos)
- [ ] API responde em todos os endpoints
- [ ] Notificação de teste envia com sucesso
- [ ] App abre no emulador
- [ ] Permissão de notificações concedida
- [ ] FCM token registrado no backend
- [ ] Produtos carregam na lista do app
- [ ] Pull-to-refresh funciona
- [ ] Busca filtra produtos
- [ ] Filtro "Estoque Baixo" funciona
- [ ] Notificação chega com app em foreground
- [ ] Notificação chega com app em background
- [ ] Cron executa a cada 15 minutos
- [ ] Cooldown de 24h funciona

---

**Data dos testes:** 29/12/2025
**Versões:**

- Backend: Node.js 20.19.6
- App: React Native 0.83.1
- Firebase Admin SDK: 13.6.0
