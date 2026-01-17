#!/bin/bash

# =============================================================================
# NFloor - Setup Local para macOS
# Execute na raiz do projeto: ./scripts/setup-local-mac.sh
# =============================================================================

set -e

echo "🍎 NFloor - Setup Local (macOS)"
echo "================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Erro: Execute este script na raiz do projeto NFloor${NC}"
    exit 1
fi

# 1. Verificar Homebrew
echo -e "${GREEN}[1/6] Verificando Homebrew...${NC}"
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Homebrew não encontrado. Instalando...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 2. Verificar/Instalar PostgreSQL
echo -e "${GREEN}[2/6] Verificando PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL não encontrado. Instalando...${NC}"
    brew install postgresql@16
    brew services start postgresql@16
    echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
else
    echo "PostgreSQL já instalado: $(psql --version)"
fi

# Garantir que PostgreSQL está rodando
echo -e "${GREEN}[3/6] Iniciando PostgreSQL...${NC}"
brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || true

# Aguardar PostgreSQL iniciar
sleep 2

# 3. Criar banco de dados
echo -e "${GREEN}[4/6] Criando banco de dados...${NC}"
DB_NAME="nfloor_dev"

# Tentar criar o banco (ignora erro se já existe)
createdb ${DB_NAME} 2>/dev/null || echo "Banco ${DB_NAME} já existe"

# 4. Criar arquivo .env.local
echo -e "${GREEN}[5/6] Configurando variáveis de ambiente...${NC}"
if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
DATABASE_URL="postgresql://$(whoami)@localhost:5432/${DB_NAME}"
JWT_SECRET="dev-secret-key-nfloor-local-development-123456"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF
    echo "Arquivo .env.local criado"
else
    echo "Arquivo .env.local já existe"
fi

# 5. Instalar dependências e configurar banco
echo -e "${GREEN}[6/6] Configurando aplicação...${NC}"
npm install

# Gerar cliente Prisma
npx prisma generate

# Criar tabelas
npx prisma db push

# Popular dados de teste
npm run db:seed

echo ""
echo -e "${GREEN}✅ Setup concluído com sucesso!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Usuários de Teste (senha: 123456):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Super Admin:      admin@nfloor.com"
echo "Diretor:          diretor@demo.com"
echo "Superintendente:  superintendente@demo.com"
echo "Gerente:          gerente@demo.com"
echo "Vendedor 1:       vendedor1@demo.com"
echo "Vendedor 2:       vendedor2@demo.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para iniciar o servidor de desenvolvimento:"
echo "  npm run dev"
echo ""
echo "Acesse: http://localhost:3000"
