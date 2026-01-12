#!/bin/bash

# Script de Deploy Docker para OVH
# Autor: Copilot
# Data: 10/01/2026

set -e

echo "🚀 Deploy MG Trator API - Docker"
echo "================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado!"
    echo "Instale com: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker compose &> /dev/null; then
    log_error "Docker Compose não está instalado!"
    echo "Instale com: apt install docker-compose-plugin"
    exit 1
fi

log_info "Docker e Docker Compose encontrados"

# Parar PM2 se estiver rodando
if command -v pm2 &> /dev/null; then
    log_warn "Parando PM2..."
    pm2 stop all || true
    pm2 delete all || true
fi

# Parar containers antigos
log_info "Parando containers antigos..."
docker compose down || true

# Copiar .env.docker para .env
if [ -f ".env.docker" ]; then
    log_info "Usando .env.docker como .env"
    cp .env.docker .env
else
    log_error "Arquivo .env.docker não encontrado!"
    exit 1
fi

# Verificar se o arquivo Firebase existe
if [ ! -f "mg-estoque-app-firebase-adminsdk-fbsvc-a7d1ee22d5.json" ]; then
    log_error "Arquivo de credenciais Firebase não encontrado!"
    exit 1
fi

# Build da imagem
log_info "Construindo imagem Docker..."
docker compose build --no-cache

# Iniciar containers
log_info "Iniciando containers..."
docker compose up -d

# Aguardar containers ficarem saudáveis
log_info "Aguardando containers ficarem prontos..."
sleep 10

# Verificar status
log_info "Status dos containers:"
docker compose ps

# Verificar logs
log_info "Últimas linhas dos logs:"
docker compose logs --tail=20

# Testar API
log_info "Testando API..."
sleep 5
if curl -f http://localhost:3000/product &> /dev/null; then
    log_info "✓ API está respondendo!"
else
    log_error "API não está respondendo"
    docker compose logs api
    exit 1
fi

echo ""
echo "================================"
log_info "Deploy concluído com sucesso!"
echo ""
echo "📝 Comandos úteis:"
echo "  docker compose logs -f              # Ver logs em tempo real"
echo "  docker compose ps                   # Ver status dos containers"
echo "  docker compose restart api          # Reiniciar API"
echo "  docker compose down                 # Parar tudo"
echo "  docker compose up -d                # Iniciar tudo"
echo ""
