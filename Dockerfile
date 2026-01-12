# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependências do builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar código fonte
COPY --chown=nodejs:nodejs . .

# Criar diretório para o arquivo Firebase
RUN mkdir -p /app/credentials && \
    chown -R nodejs:nodejs /app/credentials

# Expor porta
EXPOSE 3000

# Mudar para usuário não-root
USER nodejs

# Comando de inicialização
CMD ["node", "src/index.js"]
