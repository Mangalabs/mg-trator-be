#!/bin/bash

# Deploy rápido no OVH - Atualiza apenas a API

echo "🚀 Fazendo deploy no servidor OVH..."

ssh debian@vps-e6270121.vps.ovh.net << 'ENDSSH'
cd ~/mg-trator-be
echo "📥 Pulling latest changes..."
git pull origin main

echo "🐳 Rebuilding API container..."
docker compose build api

echo "🔄 Restarting API container..."
docker compose up -d api

echo "⏳ Aguardando container iniciar..."
sleep 5

echo "✅ Checking container status..."
docker compose ps

echo "📋 Últimos logs:"
docker compose logs api --tail=30

echo ""
echo "✅ Deploy concluído!"
echo "🌐 API: http://37.59.103.70:3000"
echo "🔔 Cron: Verificação a cada 30 minutos"
ENDSSH

echo ""
echo "🎉 Deploy finalizado com sucesso!"
