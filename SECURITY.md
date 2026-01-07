# 🔐 Guia de Segurança - MG Trator Backend

## ⚠️ Arquivos Sensíveis (NÃO COMMITAR)

### Credenciais e Tokens

- ✅ `.env` - Protegido pelo .gitignore
- ✅ `*.json` (exceto package files) - Bloqueados
- ✅ `mg-estoque-app-firebase-adminsdk-*.json` - Credenciais Firebase

### Banco de Dados

- ✅ `*.sqlite` - Banco local
- ✅ `*.sqlite3` - Variantes SQLite
- ✅ `*.db` - Arquivos de banco

### Outros

- ✅ `node_modules/` - Dependências
- ✅ `*.log` - Logs do sistema

## ✅ Arquivos Seguros (PODEM SER COMMITADOS)

### Templates e Exemplos

- `.env.example` - Template de variáveis sem valores reais
- `firebase-adminsdk.example.json` - Estrutura Firebase sem credenciais
- `README.md` - Documentação pública
- `package.json` / `package-lock.json` - Dependências

### Código Fonte

- `src/**/*.js` - Todo código JavaScript
- `*.apib` - Documentação API Blueprint

## 🚨 Como Proteger Credenciais

### 1. Nunca commitar arquivos sensíveis

```bash
# Se acidentalmente adicionou, remova do stage:
git restore --staged .env
git restore --staged *.json
git restore --staged *.sqlite
```

### 2. Verificar antes de commit

```bash
# Ver o que vai ser commitado:
git status

# Verificar conteúdo:
git diff --staged
```

### 3. Remover arquivo já commitado

Se já fez commit de um arquivo sensível:

```bash
# Remover do histórico mas manter localmente
git rm --cached arquivo-sensivel.json

# Commitar remoção
git commit -m "Remove arquivo sensível"

# IMPORTANTE: Rotacionar credenciais imediatamente!
```

### 4. Rotacionar credenciais comprometidas

Se credenciais vazaram:

**Firebase:**

1. Acesse Firebase Console
2. Vá em Project Settings > Service Accounts
3. Delete a chave antiga
4. Gere nova chave privada

**API Gestão Click:**

1. Acesse painel da API
2. Revogue tokens antigos
3. Gere novos tokens
4. Atualize `.env` local

## 📋 Checklist Antes de Push

- [ ] Executei `git status` e verifiquei arquivos
- [ ] `.env` NÃO está na lista
- [ ] Arquivos `*.json` (exceto package) NÃO estão na lista
- [ ] Bancos `*.sqlite` NÃO estão na lista
- [ ] Apenas código e arquivos `.example` serão enviados
- [ ] Li o `git diff --staged` e não vi credenciais

## 🛡️ Proteções Implementadas

### .gitignore Configurado

```
✅ .env e variantes
✅ *.json (com exceções para package files e examples)
✅ *.sqlite, *.db
✅ node_modules/
✅ *.log
✅ Arquivos de IDE e OS
```

### Arquivos de Exemplo Criados

```
✅ .env.example - Template de variáveis
✅ firebase-adminsdk.example.json - Estrutura Firebase
✅ README.md - Instruções de setup
```

## 🚀 Setup em Nova Máquina

1. Clone o repositório
2. Copie os arquivos example:
   ```bash
   cp .env.example .env
   ```
3. Preencha com credenciais reais
4. Baixe credenciais Firebase do console
5. Execute migrations do banco
6. Pronto para desenvolvimento!

## 📞 Em Caso de Vazamento

1. **PARE** - Não faça mais pushes
2. **ROTACIONE** - Mude todas as credenciais imediatamente
3. **NOTIFIQUE** - Informe a equipe
4. **DOCUMENTE** - Registre o incidente
5. **APRENDA** - Revise processos para evitar repetição

## 🔍 Auditoria

Para verificar se há credenciais commitadas:

```bash
# Buscar por padrões comuns
git log -S "private_key" --all
git log -S "access_token" --all
git log -S "password" --all
```

---

**Lembre-se:** Segurança é responsabilidade de todos! 🔐
