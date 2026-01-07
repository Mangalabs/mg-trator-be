# MG Trator Backend

Backend do sistema de gerenciamento de estoque com notificações push.

## 🔧 Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

- `PORT`: Porta do servidor (padrão: 3000)
- `CLICK_API_URL`: URL da API Gestão Click
- `CLICK_API_ACCESS_TOKEN`: Token de acesso da API
- `CLICK_API_PRIVATE_TOKEN`: Token privado da API

### 3. Configurar Firebase Admin SDK

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Project Settings** > **Service Accounts**
3. Clique em **Generate New Private Key**
4. Salve o arquivo JSON baixado como `mg-estoque-app-firebase-adminsdk-xxxxx.json` na raiz do projeto
5. Atualize o caminho no arquivo `src/firebase/index.js` se necessário

### 4. Configurar banco de dados

```bash
npx knex migrate:latest
```

## 🚀 Executar

### Desenvolvimento

```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 📝 Estrutura de Arquivos Sensíveis

**⚠️ NUNCA commitar estes arquivos:**

- `.env` - Variáveis de ambiente
- `*.json` (exceto package.json) - Credenciais Firebase
- `*.sqlite` / `*.db` - Banco de dados

**✅ Arquivos de exemplo (podem ser commitados):**

- `.env.example` - Template de variáveis
- `firebase-adminsdk.example.json` - Template de credenciais Firebase

## 🔐 Segurança

Este repositório está configurado com `.gitignore` para prevenir commit acidental de:

- Credenciais (`.env`, `*.json`)
- Banco de dados (`*.sqlite`, `*.db`)
- Dependências (`node_modules/`)
- Arquivos de log (`*.log`)

## 📡 API Endpoints

- `GET /product` - Lista produtos
- `POST /product` - Cria produto
- `PUT /product/:id` - Atualiza produto
- `PATCH /product/:id/notifications` - Toggle notificações
- `POST /messaging/test` - Teste de notificação

## 🔔 Sistema de Notificações

O sistema usa Firebase Cloud Messaging (FCM) com:

- Cron job executando a cada 15 minutos
- Cooldown de 24 horas entre notificações do mesmo produto
- Tópicos específicos por produto (`product_{id}`)

Veja mais detalhes em `TESTING_GUIDE.md`.
