#!/bin/bash
# ============================================================================
# NFloor - Database Setup Script
# ============================================================================

set -e

echo "🔧 NFloor - Setup do Banco de Dados PostgreSQL"
echo "================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
DB_NAME="nfloor"
DB_USER="nfloor_user"
DB_PASS="nfloor_password_2024"
DB_HOST="localhost"
DB_PORT="5432"

# 1. Verificar se PostgreSQL está rodando
echo -e "\n${YELLOW}1. Verificando PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL não encontrado. Instale com: brew install postgresql@16${NC}"
    exit 1
fi

if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL não está rodando. Inicie com: brew services start postgresql@16${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL está rodando${NC}"

# 2. Criar usuário se não existir
echo -e "\n${YELLOW}2. Criando usuário $DB_USER...${NC}"
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
    psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
echo -e "${GREEN}✓ Usuário criado/verificado${NC}"

# 3. Criar banco se não existir
echo -e "\n${YELLOW}3. Criando banco de dados $DB_NAME...${NC}"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
echo -e "${GREEN}✓ Banco criado/verificado${NC}"

# 4. Dar permissões
echo -e "\n${YELLOW}4. Configurando permissões...${NC}"
psql -U postgres -d $DB_NAME -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -U postgres -d $DB_NAME -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;"
psql -U postgres -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
psql -U postgres -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"
echo -e "${GREEN}✓ Permissões configuradas${NC}"

# 5. Criar extensões
echo -e "\n${YELLOW}5. Criando extensões...${NC}"
psql -U postgres -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U postgres -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
echo -e "${GREEN}✓ Extensões criadas${NC}"

# 6. Atualizar .env se existir
ENV_FILE=".env"
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"

echo -e "\n${YELLOW}6. Configurando variáveis de ambiente...${NC}"
if [ -f "$ENV_FILE" ]; then
    # Atualizar DATABASE_URL existente ou adicionar
    if grep -q "DATABASE_URL" "$ENV_FILE"; then
        sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" "$ENV_FILE"
    else
        echo "DATABASE_URL=\"$DATABASE_URL\"" >> "$ENV_FILE"
    fi
else
    # Criar .env a partir do .env.example
    if [ -f ".env.example" ]; then
        cp .env.example "$ENV_FILE"
        sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" "$ENV_FILE"
    else
        echo "DATABASE_URL=\"$DATABASE_URL\"" > "$ENV_FILE"
        echo "JWT_SECRET=\"$(openssl rand -base64 32)\"" >> "$ENV_FILE"
    fi
fi
echo -e "${GREEN}✓ Arquivo .env configurado${NC}"

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Setup do banco concluído com sucesso!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "\nDATABASE_URL: ${YELLOW}$DATABASE_URL${NC}"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo "  npm run db:generate  # Gerar cliente Prisma"
echo "  npm run db:push      # Criar tabelas"
echo "  npm run db:seed      # Popular com dados de teste"
