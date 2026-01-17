#!/bin/bash

# =============================================================================
# NFloor - Script de Setup do Servidor
# Execute como root em um servidor Ubuntu 22.04 limpo
# =============================================================================

set -e

echo "🚀 NFloor Server Setup Script"
echo "=============================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis configuráveis
DOMAIN="${1:-nfloor.fluxos.co}"
DB_NAME="nfloor_prod"
DB_USER="nfloor_user"
DB_PASS=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
JWT_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)
APP_USER="nfloor"

echo -e "${YELLOW}Configurando para domínio: ${DOMAIN}${NC}"

# 4. Configurar PostgreSQL
echo -e "${GREEN}[4/8] Configurando PostgreSQL...${NC}"
sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

# 5. Criar usuário da aplicação
echo -e "${GREEN}[5/8] Criando usuário ${APP_USER}...${NC}"
if id "${APP_USER}" &>/dev/null; then
    echo "Usuário ${APP_USER} já existe"
else
    useradd -m -s /bin/bash ${APP_USER}
    echo "${APP_USER}:$(openssl rand -base64 12)" | chpasswd
fi

# 6. Configurar Nginx
echo -e "${GREEN}[6/8] Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/${DOMAIN} << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 7. Criar arquivo de credenciais
echo -e "${GREEN}[7/8] Salvando credenciais...${NC}"
CREDENTIALS_FILE="/root/nfloor-credentials.txt"
cat > ${CREDENTIALS_FILE} << EOF
=============================================================================
NFloor - Credenciais de Produção
Gerado em: $(date)
=============================================================================

DOMÍNIO: ${DOMAIN}

BANCO DE DADOS:
  Host: localhost
  Database: ${DB_NAME}
  User: ${DB_USER}
  Password: ${DB_PASS}

DATABASE_URL:
postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

JWT_SECRET:
${JWT_SECRET}

=============================================================================
PRÓXIMOS PASSOS:
=============================================================================

1. Clone o repositório como usuário nfloor:
   su - nfloor
   git clone <repo-url> nfloor
   cd nfloor

2. Crie o arquivo .env.local:
   cat > .env.local << 'ENVEOF'
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
JWT_SECRET="${JWT_SECRET}"
NEXT_PUBLIC_APP_URL="https://${DOMAIN}"
NODE_ENV="production"
ENVEOF

3. Instale e configure:
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run build

4. Inicie com PM2:
   pm2 start npm --name "nfloor" -- start
   pm2 startup
   pm2 save

5. Configure SSL:
   sudo certbot --nginx -d ${DOMAIN}

=============================================================================
EOF

chmod 600 ${CREDENTIALS_FILE}

# 8. Finalização
echo -e "${GREEN}[8/8] Finalizando...${NC}"

echo ""
echo -e "${GREEN}✅ Setup do servidor concluído!${NC}"
echo ""
echo -e "${YELLOW}IMPORTANTE: Credenciais salvas em:${NC}"
echo -e "${RED}${CREDENTIALS_FILE}${NC}"
echo ""
echo "Para ver as credenciais e próximos passos:"
echo "  cat ${CREDENTIALS_FILE}"
echo ""
