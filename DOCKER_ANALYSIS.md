# 📊 Análise de Injeção de Variáveis de Ambiente

## 🔍 Estado Atual

### Como as variáveis são injetadas:

1. **Arquivo `.env` na raiz**

   ```javascript
   // src/index.js
   const dotenv = require('dotenv')
   dotenv.config() // Carrega .env automaticamente
   const { PORT } = process.env
   ```

2. **Uso direto de `process.env`**

   ```javascript
   // src/cron/notificationCron.js
   const CLICK_API_URL = process.env.CLICK_API_URL || 'default'
   const CLICK_API_ACCESS_TOKEN = process.env.CLICK_API_ACCESS_TOKEN
   ```

3. **Credenciais Firebase hardcoded**

   ```javascript
   // src/firebase/index.js
   const serviceAccount = require('../../mg-estoque-app-firebase-adminsdk-fbsvc-a7d1ee22d5.json')
   // ⚠️ PROBLEMA: Caminho fixo para arquivo local
   ```

4. **Banco de dados hardcoded**
   ```javascript
   // knexfile.js - development
   connection: {
     filename: './dev.sqlite3', // ⚠️ Caminho fixo
   }
   ```

---

## ⚠️ Problemas Identificados

### 1. **Credenciais Firebase não configuráveis**

- ❌ Arquivo JSON hardcoded no código
- ❌ Não pode ser alterado via variável de ambiente
- ❌ Dificulta deploy em diferentes ambientes

### 2. **Banco SQLite não escalável**

- ❌ SQLite em arquivo local (não compartilhado)
- ❌ Não suporta múltiplas instâncias
- ❌ Arquivo não persiste em containers efêmeros

### 3. **Sem separação de ambientes**

- ❌ Não usa `NODE_ENV`
- ❌ Sempre roda em modo "development"
- ❌ Configurações de staging/production existem mas não são usadas

### 4. **Porta hardcoded em alguns lugares**

- ⚠️ Apenas no .env, mas sem fallback robusto
- ⚠️ Frontend precisa saber o IP manualmente

### 5. **CORS muito permissivo**

```javascript
cors({
  origin: '*', // ⚠️ Aceita qualquer origem (inseguro em produção)
})
```

---

## 🤔 Dockerização é Necessária?

### ✅ **SIM, Dockerização é ALTAMENTE RECOMENDADA**

**Motivos:**

1. **Isolar Dependências**

   - Node.js específico (v20.19.6)
   - Dependências nativas (sqlite3, sharp)
   - Evita "funciona na minha máquina"

2. **Facilitar Deploy**

   - Build uma vez, deploy em qualquer lugar
   - Ambiente consistente (dev = prod)
   - CI/CD mais simples

3. **Gerenciar Múltiplos Serviços**

   - Backend Node.js
   - Banco de dados (PostgreSQL em produção)
   - Cron jobs
   - Possível cache (Redis)

4. **Melhorar Segurança**

   - Variáveis de ambiente via Docker secrets
   - Network isolation
   - Non-root user

5. **Escalabilidade**
   - Fácil de replicar instâncias
   - Load balancing
   - Health checks automáticos

---

## 🎯 Recomendações de Melhorias

### **Prioridade ALTA - Fazer ANTES de Dockerizar:**

#### 1. Tornar Firebase Configurável via ENV

```javascript
// Ao invés de:
const serviceAccount = require('../../arquivo-fixo.json')

// Usar:
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  // ...
}
```

#### 2. Adicionar NODE_ENV

```javascript
// .env
NODE_ENV = development

// src/index.js
const environment = process.env.NODE_ENV || 'development'
const config = knexfile[environment]
```

#### 3. Melhorar CORS

```javascript
cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:8081',
  credentials: true,
})
```

#### 4. Configurar Banco via ENV

```javascript
// knexfile.js
development: {
  client: 'sqlite3',
  connection: {
    filename: process.env.DB_FILE || './dev.sqlite3'
  }
},
production: {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 10
  }
}
```

---

## 📦 Estrutura Docker Recomendada

### Fase 1: Docker Básico (Recomendado AGORA)

```
docker-compose.yml
├── backend (Node.js)
├── postgres (Produção)
└── networks & volumes
```

### Fase 2: Docker Avançado (Futuro)

```
docker-compose.yml
├── backend (Node.js)
├── postgres
├── redis (Cache)
├── nginx (Reverse proxy)
└── monitoring (opcional)
```

---

## 📋 Checklist de Ações

### **Antes de Dockerizar:**

- [ ] Tornar Firebase configurável via ENV
- [ ] Adicionar variável NODE_ENV
- [ ] Configurar banco de dados via ENV
- [ ] Melhorar configuração CORS
- [ ] Adicionar variáveis para cron schedule
- [ ] Documentar todas as variáveis necessárias

### **Durante Dockerização:**

- [ ] Criar Dockerfile otimizado
- [ ] Criar docker-compose.yml
- [ ] Configurar volumes para persistência
- [ ] Adicionar health checks
- [ ] Configurar networks isoladas
- [ ] Adicionar .dockerignore

### **Depois de Dockerizar:**

- [ ] Testar em ambiente local
- [ ] Documentar comandos Docker
- [ ] Criar scripts de deploy
- [ ] Configurar CI/CD
- [ ] Monitorar logs e performance

---

## 💡 Conclusão

**Status:** ⚠️ **Projeto PRONTO para desenvolvimento local mas NÃO PRONTO para produção**

**Ação Recomendada:**

1. ✅ **Refatorar injeção de ENV** (2-3 horas)
2. ✅ **Dockerizar** (1-2 horas)
3. ✅ **Testar localmente** (1 hora)
4. 🚀 **Deploy em produção**

**Benefício:** Sistema robusto, escalável e fácil de manter!
