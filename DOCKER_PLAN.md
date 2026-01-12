# 🐳 Plano de Dockerização - MG Trator Backend

## 📊 Análise do Estado Atual

### Tecnologias Identificadas:

- **Runtime:** Node.js v20.19.6
- **Package Manager:** npm 10.8.2
- **Framework:** Express 5.1.0
- **Banco Dev:** SQLite 5.1.7
- **Banco Prod:** PostgreSQL (via pg 8.16.3)
- **Firebase Admin:** 13.6.0
- **Cron:** node-cron 4.2.1
- **Tamanho:** ~204MB com node_modules

### Arquivos Críticos:

- ✅ `.env` (não commitado - seguro)
- ✅ `knexfile.js` (multi-ambiente configurado)
- ✅ `src/firebase/index.js` (ENV configurável)
- ✅ `src/index.js` (NODE_ENV implementado)
- ⚠️ `mg-estoque-app-firebase-adminsdk-*.json` (não commitado)
- ⚠️ `dev.sqlite3` (desenvolvimento local)

### Dependências Nativas:

- `sqlite3` - Requer compilação nativa
- `pg` - Cliente PostgreSQL
- `firebase-admin` - SDK Firebase

---

## 🎯 Objetivos da Dockerização

### Metas Primárias:

1. **Isolar ambiente** - Mesmo Node/npm em qualquer máquina
2. **Facilitar deploy** - Build uma vez, roda em qualquer lugar
3. **PostgreSQL em produção** - Substituir SQLite
4. **Persistência de dados** - Volumes Docker
5. **Escalabilidade** - Múltiplas instâncias possíveis

### Metas Secundárias:

6. **Health checks** - Monitorar saúde do container
7. **Logs centralizados** - Docker logs
8. **Secrets seguros** - Docker secrets ou ENV
9. **CI/CD ready** - Preparado para pipelines
10. **Hot reload em dev** - Volumes para desenvolvimento

---

## 📋 Passo a Passo Detalhado

### **FASE 1: Preparação (5 min)**

#### 1.1. Criar `.dockerignore`

**O que faz:** Evita copiar arquivos desnecessários para a imagem Docker  
**Arquivos a ignorar:**

```
node_modules/
npm-debug.log
.env
.git/
.gitignore
*.md
dev.sqlite3
*.sqlite
*.sqlite3
.vscode/
.idea/
coverage/
.DS_Store
```

**Por quê:** Reduz tamanho da imagem e tempo de build

---

### **FASE 2: Dockerfile (30 min)**

#### 2.1. Estrutura Multi-Stage Build

**O que é:** Build em etapas para otimizar tamanho final

**Etapas:**

1. **base** - Configurações comuns
2. **dependencies** - Instalar dependências
3. **development** - Ambiente de dev com hot reload
4. **production** - Imagem otimizada final

#### 2.2. Dockerfile Completo

```dockerfile
# Etapa 1: Base
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Etapa 2: Dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production
RUN cp -R node_modules /prod_node_modules
RUN npm ci

# Etapa 3: Development
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Etapa 4: Production
FROM base AS production
COPY package*.json ./
COPY --from=dependencies /prod_node_modules ./node_modules
COPY . .
RUN npm run migrate
EXPOSE 3000
USER node
CMD ["npm", "run", "start:prod"]
```

**Explicação das escolhas:**

- `node:20-alpine` - Imagem leve (só 40MB base)
- `apk add python3 make g++` - Para compilar dependências nativas (sqlite3)
- `npm ci` - Instala exatamente o que está no package-lock.json
- `--only=production` - Sem devDependencies em produção
- `USER node` - Segurança: não roda como root
- Multi-stage - Reduz imagem final de ~200MB para ~150MB

---

### **FASE 3: Docker Compose (45 min)**

#### 3.1. Estrutura docker-compose.yml

**Serviços:**

1. **app** - Backend Node.js
2. **postgres** - Banco de dados
3. **postgres-test** - Banco de testes (opcional)

#### 3.2. docker-compose.yml Completo

```yaml
version: '3.8'

services:
  # Backend Node.js
  app:
    build:
      context: .
      target: ${BUILD_TARGET:-production}
      dockerfile: Dockerfile
    container_name: mg-trator-backend
    ports:
      - '${PORT:-3000}:3000'
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=3000
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - CLICK_API_URL=${CLICK_API_URL}
      - CLICK_API_ACCESS_TOKEN=${CLICK_API_ACCESS_TOKEN}
      - CLICK_API_PRIVATE_TOKEN=${CLICK_API_PRIVATE_TOKEN}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PRIVATE_KEY_ID=${FIREBASE_PRIVATE_KEY_ID}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      - FIREBASE_CLIENT_ID=${FIREBASE_CLIENT_ID}
      - FIREBASE_CLIENT_CERT_URL=${FIREBASE_CLIENT_CERT_URL}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    volumes:
      - ./src:/app/src:ro # Read-only em produção
      - node_modules:/app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - mg-network
    restart: unless-stopped
    healthcheck:
      test:
        [
          'CMD',
          'wget',
          '--quiet',
          '--tries=1',
          '--spider',
          'http://localhost:3000/health',
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    container_name: mg-trator-postgres
    environment:
      - POSTGRES_DB=${DB_NAME:-mg_trator}
      - POSTGRES_USER=${DB_USER:-postgres}
      - POSTGRES_PASSWORD=${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    networks:
      - mg-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER:-postgres}']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
  node_modules:
    driver: local

networks:
  mg-network:
    driver: bridge
```

**Explicação das escolhas:**

- `version: '3.8'` - Versão estável do Compose
- `target: ${BUILD_TARGET}` - Permite trocar dev/prod
- `depends_on: service_healthy` - Aguarda Postgres estar pronto
- `volumes: src:/app/src:ro` - Hot reload em dev
- `postgres:16-alpine` - Versão LTS leve do PostgreSQL
- `postgres_data` - Persistência do banco
- `healthcheck` - Monitora saúde dos containers
- `restart: unless-stopped` - Auto-restart em falhas
- `networks` - Isolamento de rede

---

### **FASE 4: Configuração ENV (15 min)**

#### 4.1. Criar `.env.docker`

Arquivo específico para Docker com valores padrão:

```env
# Docker Environment
NODE_ENV=production
PORT=3000
BUILD_TARGET=production

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=mg_trator
DB_USER=postgres
DB_PASSWORD=changeme_in_production
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# API Click
CLICK_API_URL=https://api.gestaoclick.com/api
CLICK_API_ACCESS_TOKEN=your_token_here
CLICK_API_PRIVATE_TOKEN=your_token_here

# Firebase (usar variáveis individuais em produção)
FIREBASE_PROJECT_ID=mg-estoque-app
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_CLIENT_CERT_URL=

# CORS
ALLOWED_ORIGINS=http://localhost:8081,http://192.168.1.100:8081
```

#### 4.2. Atualizar `.gitignore`

```
.env.docker
docker-compose.override.yml
```

---

### **FASE 5: Scripts e Comandos (20 min)**

#### 5.1. Atualizar `package.json`

Adicionar scripts Docker:

```json
"scripts": {
  "docker:build": "docker-compose build",
  "docker:up": "docker-compose up -d",
  "docker:down": "docker-compose down",
  "docker:logs": "docker-compose logs -f app",
  "docker:migrate": "docker-compose exec app npm run migrate",
  "docker:shell": "docker-compose exec app sh",
  "docker:dev": "BUILD_TARGET=development docker-compose up",
  "docker:prod": "BUILD_TARGET=production docker-compose up -d"
}
```

#### 5.2. Criar Health Check Endpoint

Adicionar em `src/index.js`:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  })
})
```

---

### **FASE 6: Desenvolvimento Local (10 min)**

#### 6.1. Criar `docker-compose.dev.yml`

Override para desenvolvimento:

```yaml
version: '3.8'

services:
  app:
    build:
      target: development
    environment:
      - NODE_ENV=development
    volumes:
      - ./src:/app/src
      - ./package.json:/app/package.json
    command: npm run dev
```

#### 6.2. Comando para dev:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

### **FASE 7: Otimizações (15 min)**

#### 7.1. .dockerignore Otimizado

```
# Dependencies
node_modules/
npm-debug.log
yarn-error.log

# Development
.git/
.gitignore
.vscode/
.idea/
*.md
!README.md

# Environment
.env
.env.*
!.env.example

# Database
*.sqlite
*.sqlite3
dev.sqlite3

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
coverage/

# Docs
docs/
TESTING_GUIDE.md
SECURITY.md
DOCKER_ANALYSIS.md
REFACTORING_REPORT.md
```

#### 7.2. Multi-stage Build Otimizado

- Cacheia layers do npm install
- Remove devDependencies em prod
- Minimiza layers finais
- Reduz de ~200MB para ~150MB

---

### **FASE 8: Segurança (20 min)**

#### 8.1. Docker Secrets (Produção)

Para produção, usar secrets ao invés de ENV:

```yaml
services:
  app:
    secrets:
      - db_password
      - firebase_key
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - FIREBASE_KEY_FILE=/run/secrets/firebase_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  firebase_key:
    file: ./secrets/firebase_key.json
```

#### 8.2. User Não-Root

Já implementado no Dockerfile:

```dockerfile
USER node
```

#### 8.3. Read-only Filesystem

```yaml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
```

---

### **FASE 9: Monitoramento (15 min)**

#### 9.1. Health Checks

- App: HTTP check em `/health`
- PostgreSQL: `pg_isready`
- Intervalo: 30s
- Timeout: 10s
- Retries: 3

#### 9.2. Logs

```bash
# Ver logs em tempo real
docker-compose logs -f app

# Ver últimas 100 linhas
docker-compose logs --tail=100 app

# Ver logs do Postgres
docker-compose logs -f postgres
```

---

### **FASE 10: Deploy OVH França - Debian (60 min)**

#### 10.1. Preparação do Servidor OVH

**Especificações do ambiente:**

- **Provedor:** OVH (França - Gravelines/Roubaix)
- **OS:** Debian 12 (Bookworm) ou Debian 11 (Bullseye)
- **Arquitetura:** x86_64 (amd64)
- **Latência:** ~150-200ms para Brasil

##### 10.1.1. Acesso SSH e Atualização

```bash
# Conectar ao servidor OVH
ssh root@seu-servidor.ovh

# Atualizar sistema Debian
apt update && apt upgrade -y

# Instalar utilitários básicos
apt install -y curl wget git vim nano htop ufw
```

##### 10.1.2. Instalar Docker no Debian

```bash
# Remover versões antigas (se existirem)
apt remove -y docker docker-engine docker.io containerd runc

# Adicionar repositório oficial Docker
apt install -y ca-certificates gnupg lsb-release
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

# Habilitar Docker no boot
systemctl enable docker
systemctl start docker
```

##### 10.1.3. Configurar Firewall (UFW)

```bash
# Habilitar firewall
ufw --force enable

# Permitir SSH (CUIDADO: confirme sua porta SSH antes!)
ufw allow 22/tcp

# Permitir porta da aplicação
ufw allow 3000/tcp

# Permitir HTTP/HTTPS (se usar Nginx/Traefik)
ufw allow 80/tcp
ufw allow 443/tcp

# Verificar regras
ufw status verbose
```

##### 10.1.4. Configurar Swap (opcional, recomendado)

```bash
# Criar arquivo swap de 2GB
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

#### 10.2. Deploy da Aplicação

##### 10.2.1. Método 1: Deploy Direto (Mais Simples)

```bash
# Criar diretório para aplicação
mkdir -p /opt/mg-trator-backend
cd /opt/mg-trator-backend

# Clonar repositório (ou fazer upload via SCP/SFTP)
git clone https://github.com/Mangalabs/mg-trator-be.git .

# Criar arquivo .env.docker para produção
cat > .env.docker << 'EOF'
# Docker Environment
NODE_ENV=production
PORT=3000
BUILD_TARGET=production

# Database PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=mg_trator_prod
DB_USER=mg_user
DB_PASSWORD=SENHA_SUPER_FORTE_AQUI_123!@#
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# API Click (seus tokens reais)
CLICK_API_URL=https://api.gestaoclick.com/api
CLICK_API_ACCESS_TOKEN=seu_token_real_aqui
CLICK_API_PRIVATE_TOKEN=seu_token_privado_aqui

# Firebase (suas credenciais reais)
FIREBASE_PROJECT_ID=mg-estoque-app
FIREBASE_PRIVATE_KEY_ID=sua_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@mg-estoque-app.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=seu_client_id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40mg-estoque-app.iam.gserviceaccount.com

# CORS - IP/domínio do seu app mobile
ALLOWED_ORIGINS=https://seudominio.com.br,http://ip-do-servidor:3000
EOF

# Ajustar permissões
chmod 600 .env.docker

# Build e subir containers
docker compose --env-file .env.docker up -d --build

# Executar migrations
docker compose exec app npm run migrate

# Verificar logs
docker compose logs -f app
```

##### 10.2.2. Método 2: Com Docker Registry (Mais Profissional)

```bash
# LOCAL: Build e push para registry
docker build -t ghcr.io/mangalabs/mg-trator-backend:v1.0.0 .
docker push ghcr.io/mangalabs/mg-trator-backend:v1.0.0

# SERVIDOR OVH: Pull e deploy
cd /opt/mg-trator-backend
docker pull ghcr.io/mangalabs/mg-trator-backend:v1.0.0
docker compose up -d
docker compose exec app npm run migrate
```

---

#### 10.3. Configuração de Domínio e HTTPS

##### 10.3.1. Instalar Nginx como Reverse Proxy

```bash
# Instalar Nginx
apt install -y nginx certbot python3-certbot-nginx

# Criar configuração
cat > /etc/nginx/sites-available/mg-trator-backend << 'EOF'
server {
    listen 80;
    server_name api.seudominio.com.br;

    client_max_body_size 20M;

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

        # Timeouts para cron jobs longos
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

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

# Recarregar Nginx
systemctl reload nginx
```

##### 10.3.2. Configurar HTTPS com Let's Encrypt

```bash
# Obter certificado SSL (certifique-se que DNS está apontado!)
certbot --nginx -d api.seudominio.com.br

# Responder perguntas:
# Email: seu@email.com
# Termos: Yes
# Redirect HTTP→HTTPS: Yes

# Renovação automática já está configurada!
# Testar renovação:
certbot renew --dry-run
```

---

#### 10.4. Monitoramento e Manutenção OVH

##### 10.4.1. Logs Persistentes

```bash
# Ver logs da aplicação
docker compose logs -f app

# Ver logs do PostgreSQL
docker compose logs -f postgres

# Logs do sistema
journalctl -u docker -f

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

##### 10.4.2. Backup Automático do PostgreSQL

```bash
# Criar script de backup
cat > /opt/scripts/backup-postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup do PostgreSQL
docker compose -f /opt/mg-trator-backend/docker-compose.yml \
  exec -T postgres pg_dump -U mg_user mg_trator_prod | \
  gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup concluído: backup_$DATE.sql.gz"
EOF

chmod +x /opt/scripts/backup-postgres.sh

# Agendar backup diário às 3h da manhã
crontab -e
# Adicionar linha:
# 0 3 * * * /opt/scripts/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1
```

##### 10.4.3. Monitorar Recursos

```bash
# Uso de recursos dos containers
docker stats

# Espaço em disco
df -h

# Memória
free -h

# Processos
htop
```

##### 10.4.4. Script de Health Check

```bash
# Criar script de monitoramento
cat > /opt/scripts/healthcheck.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): OK - Aplicação saudável"
else
    echo "$(date): ERRO - Status $RESPONSE - Reiniciando containers..."
    cd /opt/mg-trator-backend
    docker compose restart app
fi
EOF

chmod +x /opt/scripts/healthcheck.sh

# Executar a cada 5 minutos
crontab -e
# Adicionar:
# */5 * * * * /opt/scripts/healthcheck.sh >> /var/log/healthcheck.log 2>&1
```

---

#### 10.5. Comandos Úteis OVH/Debian

```bash
# Atualizar aplicação (deploy nova versão)
cd /opt/mg-trator-backend
git pull origin main
docker compose down
docker compose up -d --build
docker compose exec app npm run migrate

# Reiniciar apenas app (sem derrubar Postgres)
docker compose restart app

# Ver status dos containers
docker compose ps

# Executar comando no container
docker compose exec app sh
docker compose exec postgres psql -U mg_user -d mg_trator_prod

# Limpar espaço (CUIDADO: remove imagens não usadas)
docker system prune -a

# Backup manual do banco
docker compose exec postgres pg_dump -U mg_user mg_trator_prod > backup_manual.sql

# Restaurar backup
cat backup_manual.sql | docker compose exec -T postgres psql -U mg_user -d mg_trator_prod

# Ver logs de erro do Nginx
tail -f /var/log/nginx/error.log

# Reiniciar Nginx
systemctl restart nginx

# Verificar portas abertas
netstat -tulpn | grep LISTEN
```

---

#### 10.6. Otimizações para OVH França

##### 10.6.1. Configurar NTP (Sincronização de Hora)

```bash
# Importante para tokens Firebase e logs
apt install -y systemd-timesyncd
timedatectl set-timezone America/Sao_Paulo
timedatectl set-ntp true
timedatectl status
```

##### 10.6.2. Limites do Sistema

```bash
# Aumentar limites para Docker
cat >> /etc/sysctl.conf << 'EOF'
# Otimizações Docker
vm.max_map_count=262144
fs.file-max=65535
net.core.somaxconn=1024
EOF

sysctl -p
```

##### 10.6.3. Docker Daemon Otimizado

```bash
# Configurar Docker daemon
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker
```

---

#### 10.7. Checklist Específico OVH

**Antes do deploy:**

- [ ] Servidor OVH provisionado (Debian 12 recomendado)
- [ ] SSH configurado (chave pública + senha forte)
- [ ] Docker e Docker Compose instalados
- [ ] Firewall UFW configurado
- [ ] Domínio apontando para IP do servidor (Registro A)
- [ ] `.env.docker` criado com credenciais de produção
- [ ] Backup do banco SQLite local feito

**Durante o deploy:**

- [ ] Containers sobem sem erro
- [ ] PostgreSQL aceita conexões
- [ ] Migrations executadas com sucesso
- [ ] Health check retorna 200 OK
- [ ] Nginx configurado como reverse proxy
- [ ] HTTPS funcionando (Let's Encrypt)
- [ ] CORS permitindo origem do app mobile

**Pós-deploy:**

- [ ] API acessível via domínio
- [ ] Cron job executando a cada 15min
- [ ] Notificações Firebase funcionando
- [ ] Logs sendo registrados
- [ ] Backup automático agendado
- [ ] Health check script ativo
- [ ] Documentar IPs e credenciais em local seguro

---

#### 10.8. Custos Estimados OVH França

**Servidores Recomendados:**

| Tipo          | vCPU | RAM | Disco     | Preço/mês | Indicado para           |
| ------------- | ---- | --- | --------- | --------- | ----------------------- |
| VPS Starter   | 1    | 2GB | 20GB SSD  | ~€3.50    | Desenvolvimento/Teste   |
| VPS Essential | 2    | 4GB | 80GB SSD  | ~€6.50    | **Produção Pequena** ✅ |
| VPS Comfort   | 4    | 8GB | 160GB SSD | ~€12.50   | Produção Média          |

**Recomendação:** VPS Essential (2 vCPU, 4GB RAM) - Suficiente para sua aplicação com PostgreSQL + Node.js + folga para crescimento.

**Conversão:** ~R$ 40-45/mês (cotação variável)

---

## 📊 Cronograma de Implementação

| Fase      | Tarefa                     | Tempo        | Prioridade |
| --------- | -------------------------- | ------------ | ---------- |
| 1         | Criar .dockerignore        | 5 min        | Alta       |
| 2         | Criar Dockerfile           | 30 min       | Alta       |
| 3         | Criar docker-compose.yml   | 45 min       | Alta       |
| 4         | Configurar .env.docker     | 15 min       | Alta       |
| 5         | Adicionar scripts npm      | 20 min       | Média      |
| 6         | Setup desenvolvimento      | 10 min       | Média      |
| 7         | Otimizações                | 15 min       | Média      |
| 8         | Segurança                  | 20 min       | Alta       |
| 9         | Monitoramento              | 15 min       | Baixa      |
| 10        | Deploy OVH França (Debian) | 60 min       | Alta       |
| **TOTAL** | **Desenvolvimento Local**  | **3h 55min** |            |
|           | **+ Deploy OVH**           | **1h extra** |            |

---

## ⚠️ Pontos de Atenção

### 1. Firebase Credentials

**Problema:** Arquivo JSON não pode ir para Docker image  
**Solução:** Usar variáveis ENV individuais

### 2. SQLite → PostgreSQL

**Problema:** Migrations podem precisar ajustes  
**Solução:** Testar migrations em container antes

### 3. Dependências Nativas

**Problema:** `sqlite3` precisa compilação  
**Solução:** Alpine tem `python3 make g++` para build

### 4. Volumes em Produção

**Problema:** Não usar volumes em produção (exceto dados)  
**Solução:** Copiar código para imagem, só volume para Postgres

### 5. Hot Reload em Dev

**Problema:** nodemon precisa ver mudanças  
**Solução:** Volume mount de `./src:/app/src` em dev

---

## 🧪 Plano de Testes

### Teste 1: Build Local

```bash
docker build -t mg-trator-backend:test .
```

**Esperado:** Build sucesso, imagem ~150MB

### Teste 2: Compose Up

```bash
docker-compose up
```

**Esperado:** App e Postgres sobem, health checks OK

### Teste 3: Migrations

```bash
docker-compose exec app npm run migrate
```

**Esperado:** Migrations executam sem erro

### Teste 4: Health Check

```bash
curl http://localhost:3000/health
```

**Esperado:** `{"status":"healthy"}`

### Teste 5: API Funcionando

```bash
curl http://localhost:3000/product
```

**Esperado:** Lista de produtos retornada

### Teste 6: Cron Funcionando

```bash
docker-compose logs -f app | grep "Cron"
```

**Esperado:** Ver logs do cron a cada 15min

### Teste 7: Hot Reload (Dev)

Editar `src/index.js`, salvar  
**Esperado:** Server reinicia automaticamente

### Teste 8: Persistência

```bash
docker-compose down
docker-compose up -d
```

**Esperado:** Dados do Postgres preservados

---

## 📚 Documentação Adicional

### Comandos Úteis

```bash
# Desenvolvimento
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Produção
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Acessar shell
docker-compose exec app sh

# Rodar migrations
docker-compose exec app npm run migrate

# Parar tudo
docker-compose down

# Remover volumes (CUIDADO: perde dados)
docker-compose down -v

# Rebuild forçado
docker-compose build --no-cache

# Ver status
docker-compose ps

# Ver uso de recursos
docker stats
```

### Troubleshooting

**Problema:** Container não sobe  
**Solução:** `docker-compose logs app`

**Problema:** Postgres não conecta  
**Solução:** Verificar health check: `docker-compose ps`

**Problema:** Migrations falham  
**Solução:** `docker-compose exec postgres psql -U postgres -d mg_trator`

**Problema:** Hot reload não funciona  
**Solução:** Verificar volume mount em docker-compose.dev.yml

---

## ✅ Checklist Pré-Implementação

**Desenvolvimento Local:**

- [ ] Node.js v20 instalado localmente
- [ ] Docker instalado (`docker --version`)
- [ ] Docker Compose instalado (`docker-compose --version`)
- [ ] `.env` local funcionando
- [ ] Servidor roda sem Docker (`npm start`)
- [ ] Migrations funcionam localmente
- [ ] Firebase credentials disponíveis
- [ ] Backup do banco SQLite criado
- [ ] Git commit de tudo antes de começar
- [ ] Tempo disponível (~4-5 horas)

**Servidor OVH França:**

- [ ] VPS OVH provisionado (Debian 12 Bookworm)
- [ ] Acesso SSH configurado (root ou sudo)
- [ ] IP do servidor anotado
- [ ] Domínio registrado (opcional mas recomendado)
- [ ] DNS apontando para IP do servidor (Registro A)
- [ ] Credenciais de produção preparadas (.env.docker)
- [ ] Orçamento: ~€6-12/mês (~R$40-70)

**Segurança:**

- [ ] Senha forte para PostgreSQL gerada
- [ ] Tokens de API Click disponíveis
- [ ] Credenciais Firebase (JSON completo)
- [ ] Lista de origens CORS definida
- [ ] Plano de backup documentado

---

## 🎯 Resultado Esperado

### Antes (Atual):

```bash
npm install
npm run migrate
npm start
# Servidor rodando em http://localhost:3000
```

### Depois (Dockerizado):

```bash
docker-compose up -d
# Tudo funcionando automaticamente:
# - PostgreSQL configurado
# - Migrations executadas
# - Servidor rodando
# - Cron job ativo
# - Health checks monitorando
```

### Benefícios:

- ✅ Ambiente isolado e reproduzível
- ✅ PostgreSQL em produção na OVH França
- ✅ Fácil escalar (múltiplas instâncias)
- ✅ Deploy simplificado com SSH
- ✅ CI/CD pronto
- ✅ Rollback fácil
- ✅ Monitoramento integrado
- ✅ HTTPS gratuito com Let's Encrypt
- ✅ Backup automático configurado
- ✅ Servidor Debian estável e confiável

---

## 🇫🇷 Especificações OVH França

### Localização dos Datacenters:

- **Gravelines (GRA)** - Norte da França, próximo à Bélgica
- **Roubaix (RBX)** - Norte da França
- **Strasbourg (SBG)** - Leste da França

### Latência Estimada Brasil → França:

- **São Paulo → Gravelines:** ~180-220ms
- **Rio de Janeiro → Gravelines:** ~190-230ms
- **Brasília → Gravelines:** ~200-240ms

### Recomendações:

- Para API backend que não precisa de latência ultra-baixa, OVH França é excelente
- Se precisar latência menor, considerar OVH Canadá (~100-140ms) ou AWS São Paulo
- Firebase Cloud Messaging já tem latência própria, não é impactado significativamente

---

## 📝 Próximos Passos

**Quando estiver pronto para implementar:**

### Fase Local (3-4 horas):

1. Revisar este documento completo
2. Confirmar que todas as dependências estão OK
3. Fazer backup do projeto atual
4. Começar pela FASE 1 (.dockerignore)
5. Ir seguindo fase por fase até FASE 9
6. Testar localmente com `docker-compose up`
7. Validar todas as funcionalidades

### Fase Deploy OVH (1-2 horas):

1. Contratar VPS na OVH França (Debian 12)
2. Configurar servidor seguindo FASE 10
3. Instalar Docker + Docker Compose
4. Configurar firewall UFW
5. Fazer deploy da aplicação
6. Configurar domínio e HTTPS (opcional)
7. Configurar backups e monitoramento
8. Testar API em produção

**Estimativa total:** 4-6 horas de trabalho focado

**Custo mensal:** €6-12 (~R$40-70) para VPS OVH

---

## 🎓 Links Úteis OVH + Debian

### Documentação OVH:

- **VPS:** https://www.ovhcloud.com/pt/vps/
- **Guia VPS:** https://help.ovhcloud.com/csm/pt-vps-getting-started
- **Panel OVH:** https://www.ovh.com/manager/

### Documentação Debian:

- **Debian 12 (Bookworm):** https://www.debian.org/releases/bookworm/
- **Docker on Debian:** https://docs.docker.com/engine/install/debian/
- **Debian Security:** https://www.debian.org/security/

### Ferramentas:

- **Let's Encrypt:** https://letsencrypt.org/
- **Certbot Nginx:** https://certbot.eff.org/instructions?ws=nginx&os=debianbuster
- **UFW Guide:** https://wiki.debian.org/Uncomplicated%20Firewall%20%28ufw%29

---

**Status:** 📋 **PLANEJAMENTO COMPLETO - PRONTO PARA DEPLOY NA OVH FRANÇA 🇫🇷**

Quando quiser começar a dockerização e deploy na OVH, me avise! Vamos seguir este plano passo a passo. 🚀
