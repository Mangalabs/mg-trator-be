# 🐳 Deploy Docker - Guia Rápido

## 📋 Pré-requisitos no Servidor OVH

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com | sh

# 2. Instalar Docker Compose Plugin
apt update
apt install docker-compose-plugin -y

# 3. Verificar instalação
docker --version
docker compose version
```

## 🚀 Deploy Automático

```bash
# 1. Ir para o diretório do projeto
cd ~/mg-trator-be

# 2. Dar permissão de execução ao script
chmod +x deploy-docker.sh

# 3. Executar o deploy
./deploy-docker.sh
```

## 📝 Comandos Úteis

```bash
# Ver logs em tempo real
docker compose logs -f

# Ver apenas logs da API
docker compose logs -f api

# Ver apenas logs do PostgreSQL
docker compose logs -f postgres

# Ver status dos containers
docker compose ps

# Reiniciar apenas a API
docker compose restart api

# Reiniciar tudo
docker compose restart

# Parar tudo
docker compose down

# Parar e remover volumes (⚠️ apaga dados do banco)
docker compose down -v

# Iniciar novamente
docker compose up -d

# Rebuild e reiniciar
docker compose up -d --build
```

## 🔍 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker compose logs api

# Ver se o PostgreSQL está saudável
docker compose ps postgres

# Rodar migrations manualmente
docker compose exec api npx knex migrate:latest
```

### Resetar tudo

```bash
# Parar tudo
docker compose down

# Remover volumes (apaga banco de dados)
docker compose down -v

# Rebuild completo
docker compose build --no-cache

# Iniciar novamente
docker compose up -d
```

## 🔐 Firewall (se necessário)

```bash
# Permitir porta 3000
ufw allow 3000/tcp

# Ver regras
ufw status
```

## 📊 Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver containers em execução
docker ps

# Acessar shell do container
docker compose exec api sh

# Acessar PostgreSQL
docker compose exec postgres psql -U mg_admin -d mg_trator_prod
```

## 🔄 Atualização do Código

```bash
# 1. Fazer pull das mudanças
git pull

# 2. Rebuild e reiniciar
docker compose up -d --build

# Ou usar o script
./deploy-docker.sh
```

## ✅ Verificar se está funcionando

```bash
# Testar API
curl http://localhost:3000/product

# Deve retornar JSON com produtos
```

## 🎯 Próximos Passos

Após o deploy com Docker:

1. ✅ PM2 não é mais necessário (Docker gerencia os processos)
2. ✅ PostgreSQL roda em container (dados persistem em volume)
3. ✅ Reinicia automaticamente após reboot do servidor
4. ✅ Logs centralizados e fáceis de acessar
5. ✅ Migrations rodam automaticamente na inicialização
