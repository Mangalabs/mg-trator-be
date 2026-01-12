# 🚀 Deploy Simples - OVH França (Gravelines) - Sem Docker

## 📋 Informações do Servidor

- **Provedor:** OVH Cloud
- **Região:** Europa - Gravelines (GRA), França 🇫🇷
- **OS:** Debian 12 (Bookworm) - Recomendado
- **Latência BR → FR:** ~180-220ms
- **Método:** Deploy tradicional com PM2
- **Banco:** PostgreSQL nativo (sem container)

---

## 🎯 Pré-requisitos

### No seu computador local:

- [ ] Git configurado
- [ ] Código commitado no repositório
- [ ] `.env` local testado e funcionando
- [ ] Backup do `dev.sqlite3` feito

### Servidor OVH contratado:

- [ ] VPS Essential (2 vCPU, 4GB RAM) - €6.50/mês
- [ ] Debian 12 instalado
- [ ] IP do servidor anotado
- [ ] Senha root recebida por email

---

## ⚙️ FASE 1: Configuração Inicial do Servidor (15 min)

### 1.1. Primeiro Acesso SSH

```bash
# Conectar ao servidor (use a senha enviada por email)
ssh root@SEU_IP_AQUI

# Atualizar sistema
apt update && apt upgrade -y

# Instalar utilitários essenciais
apt install -y curl wget git vim nano htop ufw build-essential
```

### 1.2. Criar Usuário Não-Root (Segurança)

```bash
# Criar usuário 'deploy'
adduser deploy
usermod -aG sudo deploy

# Configurar SSH para o novo usuário
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
```

### 1.3. Configurar Firewall UFW

```bash
# Habilitar e configurar firewall
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Aplicação (temporário, depois tirar)
ufw status verbose
```

### 1.4. Configurar Fuso Horário

```bash
# Configurar para horário de Brasília
timedatectl set-timezone America/Sao_Paulo
timedatectl set-ntp true
date  # Verificar
```

---

## 📦 FASE 2: Instalar Node.js 20 (10 min)

### 2.1. Instalar Node.js via NodeSource

```bash
# Adicionar repositório NodeSource para Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Instalar Node.js
apt install -y nodejs

# Verificar instalação
node --version   # Deve mostrar v20.x.x
npm --version    # Deve mostrar 10.x.x
```

### 2.2. Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Configurar PM2 para iniciar no boot
pm2 startup systemd -u deploy --hp /home/deploy
# Copie e execute o comando que aparecer

# Verificar
pm2 --version
```

---

## 🗄️ FASE 3: Instalar e Configurar PostgreSQL (15 min)

### 3.1. Instalar PostgreSQL

```bash
# Instalar PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Verificar status
systemctl status postgresql

# Verificar versão
sudo -u postgres psql --version
```

### 3.2. Configurar Banco de Dados

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# No console do PostgreSQL, executar:
```

```sql
-- Criar usuário
CREATE USER mg_user WITH PASSWORD 'SUA_SENHA_FORTE_AQUI_123!@#';

-- Criar banco de dados
CREATE DATABASE mg_trator_prod OWNER mg_user;

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE mg_trator_prod TO mg_user;

-- Sair
\q
```

### 3.3. Configurar Acesso Local

```bash
# Editar pg_hba.conf para permitir acesso local
vim /etc/postgresql/15/main/pg_hba.conf

# Adicionar/modificar linha (depois das linhas existentes):
# local   all             mg_user                                 md5
# host    all             mg_user         127.0.0.1/32            md5

# Reiniciar PostgreSQL
systemctl restart postgresql

# Testar conexão
psql -U mg_user -d mg_trator_prod -h localhost -W
# Digitar senha e verificar se conecta
# \q para sair
```

---

## 🚀 FASE 4: Deploy da Aplicação (20 min)

### 4.1. Clonar Repositório

```bash
# Mudar para usuário deploy
su - deploy

# Criar diretório para aplicação
mkdir -p ~/apps
cd ~/apps

# Clonar repositório
git clone https://github.com/Mangalabs/mg-trator-be.git
cd mg-trator-be

# Verificar branch
git branch
git status
```

### 4.2. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env de produção
cat > .env << 'EOF'
# Ambiente
NODE_ENV=production
PORT=3000

# Database PostgreSQL
DATABASE_URL=postgresql://mg_user:SUA_SENHA_FORTE_AQUI_123!@#@localhost:5432/mg_trator_prod
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mg_trator_prod
DB_USER=mg_user
DB_PASSWORD=SUA_SENHA_FORTE_AQUI_123!@#
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# API Gestão Click (SUBSTITUA COM SEUS TOKENS REAIS)
CLICK_API_URL=https://api.gestaoclick.com/api
CLICK_API_ACCESS_TOKEN=seu_access_token_aqui
CLICK_API_PRIVATE_TOKEN=seu_private_token_aqui

# Firebase Admin SDK (SUBSTITUA COM SUAS CREDENCIAIS REAIS)
FIREBASE_PROJECT_ID=mg-estoque-app
FIREBASE_PRIVATE_KEY_ID=sua_private_key_id_aqui
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_AQUI_EM_UMA_LINHA\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@mg-estoque-app.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=seu_client_id_aqui
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40mg-estoque-app.iam.gserviceaccount.com

# CORS - Permitir origens do app
ALLOWED_ORIGINS=https://seudominio.com.br,http://SEU_IP_AQUI:3000
EOF

# Ajustar permissões
chmod 600 .env

# Editar .env para adicionar credenciais reais
nano .env  # ou vim .env
```

### 4.3. Instalar Dependências

```bash
# Instalar dependências de produção
npm ci --only=production

# Verificar se instalou corretamente
ls -la node_modules/
```

### 4.4. Executar Migrations

```bash
# Rodar migrations
npm run migrate

# Verificar se tabelas foram criadas
psql -U mg_user -d mg_trator_prod -h localhost -W -c "\dt"
# Deve listar: knex_migrations, knex_migrations_lock, product_base
```

---

## 🔧 FASE 5: Configurar PM2 (15 min)

### 5.1. Criar Arquivo de Configuração PM2

```bash
# Criar ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mg-trator-backend',
    script: './src/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    restart_delay: 4000,
    listen_timeout: 10000,
    kill_timeout: 5000,
    wait_ready: true,
    shutdown_with_message: true
  }]
}
EOF
```

### 5.2. Criar Diretório de Logs

```bash
mkdir -p logs
```

### 5.3. Iniciar Aplicação com PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs mg-trator-backend

# Salvar configuração PM2
pm2 save

# Verificar se auto-start está configurado
pm2 startup  # Se pedir, execute o comando sugerido
```

### 5.4. Testar Aplicação

```bash
# Testar health check
curl http://localhost:3000/health

# Deve retornar:
# {"status":"healthy","timestamp":"2026-01-08T...","uptime":...,"environment":"production"}

# Testar endpoint de produtos
curl http://localhost:3000/product
```

---

## 🌐 FASE 6: Configurar Nginx + HTTPS (20 min)

### 6.1. Instalar Nginx

```bash
# Voltar para root
exit  # ou su -

# Instalar Nginx
apt install -y nginx

# Iniciar e habilitar
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

### 6.2. Configurar Reverse Proxy

```bash
# Criar configuração do site
cat > /etc/nginx/sites-available/mg-trator-backend << 'EOF'
server {
    listen 80;
    server_name SEU_DOMINIO_AQUI;  # Ex: api.seusite.com.br

    client_max_body_size 20M;

    # Logs
    access_log /var/log/nginx/mg-trator-access.log;
    error_log /var/log/nginx/mg-trator-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts para operações longas (cron)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check não loga (evita poluir logs)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/mg-trator-backend /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Se OK, recarregar
systemctl reload nginx
```

### 6.3. Configurar HTTPS com Let's Encrypt

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL (certifique-se que DNS está apontado!)
certbot --nginx -d SEU_DOMINIO_AQUI

# Responder as perguntas:
# Email: seu@email.com
# Termos: Yes (Y)
# Compartilhar email: No (N)
# Redirect HTTP to HTTPS: Yes (2)

# Verificar renovação automática
certbot renew --dry-run

# Certificado renova automaticamente via cron!
```

### 6.4. Remover Acesso Direto na Porta 3000

```bash
# Agora que Nginx está configurado, remover acesso direto
ufw delete allow 3000/tcp
ufw status
```

---

## 📊 FASE 7: Monitoramento e Backup (20 min)

### 7.1. Script de Backup do PostgreSQL

```bash
# Criar diretório para scripts
mkdir -p /opt/scripts
mkdir -p /opt/backups/postgres

# Criar script de backup
cat > /opt/scripts/backup-postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="mg_trator_prod"
DB_USER="mg_user"

# Criar backup
PGPASSWORD='SUA_SENHA_FORTE_AQUI_123!@#' pg_dump -h localhost -U $DB_USER $DB_NAME | \
  gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Log
echo "$(date): Backup concluído - backup_$DATE.sql.gz"
EOF

chmod +x /opt/scripts/backup-postgres.sh

# Testar script
/opt/scripts/backup-postgres.sh
ls -lh /opt/backups/postgres/
```

### 7.2. Configurar Backup Automático (Cron)

```bash
# Editar crontab do root
crontab -e

# Adicionar linhas (pressione 'i' para inserir no vim):
# Backup diário às 3h da manhã
0 3 * * * /opt/scripts/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1

# Salvar e sair (ESC + :wq + ENTER)

# Verificar crontab
crontab -l
```

### 7.3. Script de Monitoramento

```bash
# Criar script de health check
cat > /opt/scripts/healthcheck.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): ✅ OK - Aplicação saudável"
else
    echo "$(date): ❌ ERRO - Status $RESPONSE - Reiniciando aplicação..."
    su - deploy -c "cd ~/apps/mg-trator-be && pm2 restart mg-trator-backend"
fi
EOF

chmod +x /opt/scripts/healthcheck.sh

# Adicionar ao cron (a cada 5 minutos)
crontab -e
# Adicionar:
# */5 * * * * /opt/scripts/healthcheck.sh >> /var/log/healthcheck.log 2>&1
```

### 7.4. Configurar Logrotate

```bash
# Configurar rotação de logs PM2
cat > /etc/logrotate.d/mg-trator-backend << 'EOF'
/home/deploy/apps/mg-trator-be/logs/*.log {
    daily
    rotate 7
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
}
EOF
```

---

## 🔄 FASE 8: Comandos de Manutenção

### 8.1. Gerenciar Aplicação PM2

```bash
# Como usuário deploy
su - deploy
cd ~/apps/mg-trator-be

# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs mg-trator-backend

# Ver últimas 100 linhas
pm2 logs mg-trator-backend --lines 100

# Reiniciar aplicação
pm2 restart mg-trator-backend

# Parar aplicação
pm2 stop mg-trator-backend

# Iniciar aplicação
pm2 start mg-trator-backend

# Ver informações detalhadas
pm2 info mg-trator-backend

# Monitorar recursos
pm2 monit
```

### 8.2. Atualizar Aplicação (Deploy Nova Versão)

```bash
# Como usuário deploy
su - deploy
cd ~/apps/mg-trator-be

# Backup antes de atualizar
cp .env .env.backup

# Puxar código novo
git pull origin main

# Instalar dependências (se houver novas)
npm ci --only=production

# Rodar migrations (se houver novas)
npm run migrate

# Reiniciar aplicação
pm2 restart mg-trator-backend

# Verificar logs
pm2 logs mg-trator-backend --lines 50
```

### 8.3. Verificar PostgreSQL

```bash
# Ver status do PostgreSQL
systemctl status postgresql

# Conectar ao banco
psql -U mg_user -d mg_trator_prod -h localhost -W

# Comandos úteis no PostgreSQL:
# \dt              - Listar tabelas
# \d+ product_base - Ver estrutura da tabela
# SELECT COUNT(*) FROM product_base; - Contar registros
# \q               - Sair
```

### 8.4. Verificar Nginx

```bash
# Status do Nginx
systemctl status nginx

# Testar configuração
nginx -t

# Recarregar configuração (sem downtime)
systemctl reload nginx

# Reiniciar Nginx
systemctl restart nginx

# Ver logs
tail -f /var/log/nginx/mg-trator-access.log
tail -f /var/log/nginx/mg-trator-error.log
```

### 8.5. Monitorar Recursos do Servidor

```bash
# Uso de CPU e memória
htop

# Espaço em disco
df -h

# Memória
free -h

# Processos Node
ps aux | grep node

# Verificar portas abertas
netstat -tulpn | grep LISTEN
```

---

## 🛡️ FASE 9: Segurança Adicional

### 9.1. Desabilitar Login Root via SSH

```bash
# Editar configuração SSH
vim /etc/ssh/sshd_config

# Modificar linha:
# PermitRootLogin no

# Reiniciar SSH
systemctl restart sshd

# ATENÇÃO: Certifique-se que consegue logar com usuário 'deploy' antes!
```

### 9.2. Fail2Ban (Proteção contra Brute Force)

```bash
# Instalar Fail2Ban
apt install -y fail2ban

# Criar configuração local
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log
EOF

# Iniciar e habilitar
systemctl enable fail2ban
systemctl start fail2ban
systemctl status fail2ban

# Ver IPs banidos
fail2ban-client status sshd
```

### 9.3. Configurar Swap (se não tiver)

```bash
# Verificar se tem swap
free -h

# Se não tiver, criar 2GB de swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verificar
free -h
```

---

## ✅ Checklist Pós-Deploy

Verificar se tudo está funcionando:

### Aplicação:

- [ ] `curl http://localhost:3000/health` retorna 200 OK
- [ ] `pm2 status` mostra app "online"
- [ ] `pm2 logs` não mostra erros críticos
- [ ] Cron job está executando (ver logs)

### Banco de Dados:

- [ ] PostgreSQL rodando: `systemctl status postgresql`
- [ ] Consegue conectar: `psql -U mg_user -d mg_trator_prod -h localhost -W`
- [ ] Tabelas criadas: `\dt` no psql
- [ ] Dados persistem após restart

### Nginx:

- [ ] Nginx rodando: `systemctl status nginx`
- [ ] Site acessível via domínio
- [ ] HTTPS funcionando (cadeado verde)
- [ ] HTTP redireciona para HTTPS

### Firebase:

- [ ] Notificações estão sendo enviadas
- [ ] Logs não mostram erros de autenticação Firebase

### Segurança:

- [ ] Firewall UFW ativo: `ufw status`
- [ ] Porta 3000 não acessível externamente
- [ ] Apenas 22, 80, 443 abertas
- [ ] Fail2Ban ativo: `systemctl status fail2ban`

### Backup e Monitoramento:

- [ ] Backup diário configurado: `crontab -l`
- [ ] Health check rodando: `/opt/scripts/healthcheck.sh`
- [ ] Logs rotacionando corretamente

---

## 📊 Métricas Esperadas

### Performance:

- **Tempo de resposta API:** < 200ms (endpoints simples)
- **Uso de memória:** ~100-200MB (Node.js)
- **Uso de CPU:** < 10% (em idle)
- **PostgreSQL:** ~50-100MB RAM

### Disponibilidade:

- **Uptime esperado:** > 99%
- **PM2 auto-restart:** Ativo
- **Health check:** A cada 5 minutos
- **Backup:** Diário às 3h AM

---

## 🚨 Troubleshooting

### Problema: Aplicação não inicia

```bash
# Ver logs PM2
pm2 logs mg-trator-backend --err

# Testar manualmente
su - deploy
cd ~/apps/mg-trator-be
node src/index.js
```

### Problema: Não conecta no PostgreSQL

```bash
# Ver logs do PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log

# Testar conexão
psql -U mg_user -d mg_trator_prod -h localhost -W

# Verificar pg_hba.conf
cat /etc/postgresql/15/main/pg_hba.conf
```

### Problema: Nginx não acessa aplicação

```bash
# Ver logs Nginx
tail -f /var/log/nginx/mg-trator-error.log

# Testar se app responde localmente
curl http://localhost:3000/health

# Verificar configuração
nginx -t
```

### Problema: Certificado SSL não renova

```bash
# Testar renovação
certbot renew --dry-run

# Ver status de certificados
certbot certificates

# Renovar manualmente
certbot renew --force-renewal
```

---

## 💰 Custos Mensais Estimados

| Item                                | Custo                  |
| ----------------------------------- | ---------------------- |
| VPS OVH Essential (2 vCPU, 4GB RAM) | €6.50/mês (~R$40)      |
| Domínio .com.br (opcional)          | R$40/ano (~R$3.50/mês) |
| Let's Encrypt SSL                   | Gratuito               |
| **TOTAL**                           | **~R$43-45/mês**       |

---

## 🔄 Migração Futura para Docker

Quando quiser migrar para Docker no futuro:

1. ✅ Código já está preparado (NODE_ENV, DATABASE_URL)
2. ✅ PostgreSQL já está instalado (pode reusar ou migrar)
3. ✅ `.env` já configurado
4. ✅ Nginx já funcionando como reverse proxy
5. ✅ Firewall já configurado

**Basta seguir o DOCKER_PLAN.md quando estiver pronto!**

---

## 📝 Informações Importantes

### Credenciais para Guardar:

- **IP Servidor:** SEU_IP_AQUI
- **Usuário SSH:** deploy
- **Banco PostgreSQL:**
  - Host: localhost
  - Porta: 5432
  - Database: mg_trator_prod
  - User: mg_user
  - Password: (guardar com segurança)
- **Domínio:** api.seusite.com.br
- **Logs:** /home/deploy/apps/mg-trator-be/logs/

### Arquivos Importantes:

- **Aplicação:** `/home/deploy/apps/mg-trator-be/`
- **ENV:** `/home/deploy/apps/mg-trator-be/.env`
- **PM2 Config:** `/home/deploy/apps/mg-trator-be/ecosystem.config.js`
- **Nginx Config:** `/etc/nginx/sites-available/mg-trator-backend`
- **Backup:** `/opt/backups/postgres/`
- **Scripts:** `/opt/scripts/`

---

## 🎓 Links Úteis

- **OVH Manager:** https://www.ovh.com/manager/
- **PM2 Docs:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Docs:** https://nginx.org/en/docs/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/15/
- **Let's Encrypt:** https://letsencrypt.org/
- **Node.js Docs:** https://nodejs.org/docs/latest-v20.x/api/

---

**Status:** ✅ **PRONTO PARA DEPLOY TRADICIONAL NA OVH GRAVELINES 🇫🇷**

**Tempo estimado:** 2-3 horas para configurar tudo pela primeira vez.

Quando estiver com o servidor OVH em mãos, é só seguir este guia passo a passo! 🚀
