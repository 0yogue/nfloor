#!/bin/bash

# =============================================================================
# NFloor - Script de Deploy
# Execute como usuário nfloor no diretório da aplicação
# =============================================================================

set -e

echo "🚀 NFloor Deploy Script"
echo "======================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Erro: Execute este script no diretório raiz do projeto${NC}"
    exit 1
fi

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo -e "${RED}Erro: Arquivo .env.local não encontrado${NC}"
    echo "Crie o arquivo com as variáveis de ambiente necessárias"
    exit 1
fi

echo -e "${GREEN}[1/6] Atualizando código...${NC}"
git pull origin main

echo -e "${GREEN}[2/6] Instalando dependências...${NC}"
npm install

echo -e "${GREEN}[3/6] Gerando cliente Prisma...${NC}"
npx prisma generate

echo -e "${GREEN}[4/6] Atualizando banco de dados...${NC}"
npx prisma db push

echo -e "${GREEN}[5/6] Gerando build de produção...${NC}"
npm run build

echo -e "${GREEN}[6/6] Reiniciando aplicação...${NC}"
if pm2 list | grep -q "nfloor"; then
    pm2 restart nfloor
else
    pm2 start npm --name "nfloor" -- start
    pm2 save
fi

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "Verificar status: pm2 status"
echo "Ver logs: pm2 logs nfloor"
