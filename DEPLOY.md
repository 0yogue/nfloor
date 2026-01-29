# 🚀 NFloor - Guia de Deploy e Operação

## 📋 Índice

1. [Rodar Localmente](#rodar-localmente)
2. [Usuários de Teste](#usuários-de-teste)
3. [Deploy DigitalOcean](#deploy-digitalocean)
4. [Configuração Nginx](#configuração-nginx)
5. [Troubleshooting](#troubleshooting)

---

## 🖥️ Rodar Localmente

### Pré-requisitos

```bash
# Verificar versões
node -v   # >= 18.x
npm -v    # >= 9.x
psql -V   # >= 14.x (PostgreSQL)
```

### 1. Clonar e Instalar

```bash
cd ~/projects
git clone <repo-url> nfloor
cd nfloor
npm install
```

### 2. Configurar Banco de Dados

```bash
# Criar banco PostgreSQL
createdb nfloor_dev

# Ou via psql
psql -U postgres -c "CREATE DATABASE nfloor_dev;"
```

### 3. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env.local
cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/nfloor_dev"

# Auth
JWT_SECRET="sua-chave-secreta-super-longa-aqui-123456"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Evolution API (WhatsApp) - opcional
EVOLUTION_API_URL=""
EVOLUTION_API_KEY=""
EOF
```

### 4. Criar Tabelas e Popular Dados

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar tabelas no banco
npx prisma db push

# Popular com dados de teste
npm run db:seed
```

### 5. Rodar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 👥 Usuários de Teste

Todos os usuários usam a senha: **`123456`**

| Nível | Email | Empresa | Visão |
|-------|-------|---------|-------|
| **Super Admin** | admin@nfloor.com | NFloor | Todas as empresas |
| **Diretor** | diretor@demo.com | Imobiliária Demo | Toda a empresa |
| **Superintendente** | superintendente@demo.com | Imobiliária Demo | Múltiplas áreas |
| **Superintendente (1)** | super1@demo.com | Imobiliária Demo | Múltiplas áreas |
| **Superintendente (2)** | super2@demo.com | Imobiliária Demo | Múltiplas áreas |
| **Superintendente (3)** | super3@demo.com | Imobiliária Demo | Múltiplas áreas |
| **Gerente** | gerente@demo.com | Imobiliária Demo | Área Vendas |
| **Gerentes** | gerente1@demo.com ... gerente6@demo.com | Imobiliária Demo | 1 gerente por área |
| **Vendedor 1** | vendedor1@demo.com | Imobiliária Demo | Apenas seus leads |
| **Vendedor 2** | vendedor2@demo.com | Imobiliária Demo | Apenas seus leads |
| **Vendedores** | vendedor3@demo.com ... vendedor22@demo.com | Imobiliária Demo | Vendedores distribuídos nas áreas |

### Hierarquia RBAC

```
SUPER_ADMIN (admin@nfloor.com)
    └── Vê TODAS as empresas

DIRECTOR (diretor@demo.com)
    ├── SUPERINTENDENT (superintendente@demo.com)
    ├── SUPERINTENDENT (super1@demo.com)
    ├── SUPERINTENDENT (super2@demo.com)
    └── SUPERINTENDENT (super3@demo.com)

Cada superintendência gerencia um conjunto de áreas (via `AreaManager`).

Exemplo (uma das áreas):

Área: Vendas
  └── MANAGER (gerente@demo.com ou gerente1@demo.com)
        └── SELLERS (vendedor1@demo.com, vendedor3@demo.com, ...)
```

---

## 🌊 Deploy DigitalOcean

### 1. Criar Droplet

```bash
# Especificações recomendadas:
# - Ubuntu 22.04 LTS
# - 2GB RAM / 1 CPU (mínimo)
# - 50GB SSD
# - Região: NYC ou São Paulo
```

### 2. Configuração Inicial do Servidor

```bash
# SSH para o servidor
ssh root@SEU_IP_DIGITALOCEAN

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl git nginx certbot python3-certbot-nginx

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib
```

### 3. Configurar PostgreSQL

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# No prompt do psql:
CREATE DATABASE nfloor_prod;
CREATE USER nfloor_user WITH ENCRYPTED PASSWORD 'SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE nfloor_prod TO nfloor_user;
\q
```

### 4. Criar Usuário da Aplicação

```bash
# Criar usuário não-root
adduser nfloor
usermod -aG sudo nfloor

# Mudar para o usuário
su - nfloor
```

### 5. Deploy da Aplicação

```bash
# Como usuário nfloor
cd ~
git clone <repo-url> nfloor
cd nfloor

# Instalar dependências
npm install

# Criar arquivo de ambiente
cat > .env.local << 'EOF'
DATABASE_URL="postgresql://nfloor_user:SENHA_FORTE_AQUI@localhost:5432/nfloor_prod"
JWT_SECRET="CHAVE_JWT_SUPER_SECRETA_LONGA_PRODUCAO_123456"
NEXT_PUBLIC_APP_URL="https://nfloor.fluxos.co"
NODE_ENV="production"
EOF

# Gerar Prisma e criar tabelas
npx prisma generate
npx prisma db push

# Popular banco
npm run db:seed

# Build da aplicação
npm run build
```

### 6. Configurar PM2

```bash
# Criar arquivo de configuração PM2
cat > ~/nfloor/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nfloor',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/nfloor',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Comandos úteis PM2:
pm2 logs nfloor      # Ver logs
pm2 restart nfloor   # Reiniciar
pm2 stop nfloor      # Parar
pm2 status           # Status
```

### 7. Inserir Dados de Teste (Opcional)

```bash
# Conectar ao banco
sudo -u postgres psql -d nfloor_prod

# Verificar IDs existentes
SELECT id, name, company_id FROM "User" WHERE access_level = 'DIRECTOR';
SELECT id, name FROM "Area" LIMIT 5;

# Inserir lead de teste (ajuste os IDs conforme seu banco)
INSERT INTO "Lead" (id, name, phone, email, status, notes, seller_id, area_id, company_id, created_at, updated_at)
VALUES (
  'lead_teste_001',
  'Lead Teste',
  '11999998888',
  'teste@email.com',
  'NEW',
  'Lead de teste para validação',
  'SEU_SELLER_ID',
  'SEU_AREA_ID', 
  'SEU_COMPANY_ID',
  NOW(),
  NOW()
);

# IMPORTANTE: O company_id do Lead DEVE ser igual ao company_id do usuário
# para que o lead apareça na listagem
```

---

## 🔒 Configuração Nginx

### 1. Criar Configuração do Site

```bash
# Como root
sudo nano /etc/nginx/sites-available/nfloor.fluxos.co
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name nfloor.fluxos.co;

    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name nfloor.fluxos.co;

    # SSL será configurado pelo Certbot

    # Logs
    access_log /var/log/nginx/nfloor.access.log;
    error_log /var/log/nginx/nfloor.error.log;

    # Proxy para Next.js
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files
    location /_next/static {
        proxy_pass http://127.0.0.1:3001;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /api/health {
        proxy_pass http://127.0.0.1:3001;
        proxy_read_timeout 5s;
    }
}
```

### 2. Ativar Site e SSL

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/nfloor.fluxos.co /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# Configurar SSL com Let's Encrypt
sudo certbot --nginx -d nfloor.fluxos.co

# Testar renovação automática
sudo certbot renew --dry-run
```

### 3. Configurar DNS (Cloudflare ou outro)

```
Tipo: A
Nome: nfloor
Conteúdo: SEU_IP_DIGITALOCEAN
TTL: Auto
Proxy: Desligado (ou ligado se quiser CDN)
```

---

## 🔧 Troubleshooting

### Verificar Logs

```bash
# Logs da aplicação
pm2 logs nfloor --lines 100

# Logs do Nginx
sudo tail -f /var/log/nginx/nfloor.error.log
sudo tail -f /var/log/nginx/nfloor.access.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Testar Conexão com Banco

```bash
# Testar conexão
psql -h localhost -U nfloor_user -d nfloor_prod -c "SELECT 1;"

# Ver tabelas
psql -h localhost -U nfloor_user -d nfloor_prod -c "\dt"
```

### Reiniciar Serviços

```bash
# Reiniciar aplicação
pm2 restart nfloor

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Problemas Comuns

#### 502 Bad Gateway
```bash
# Verificar se a aplicação está rodando
pm2 status

# Se não estiver, iniciar
cd /home/nfloor/nfloor
pm2 start npm --name "nfloor" -- start
```

#### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar credenciais no .env.local
cat .env.local | grep DATABASE_URL

# Testar conexão manualmente
psql "postgresql://nfloor_user:SENHA@localhost:5432/nfloor_prod"
```

#### Erro de Permissão
```bash
# Garantir permissões corretas
sudo chown -R nfloor:nfloor /home/nfloor/nfloor
```

#### Atualizar Aplicação

```bash
# Como usuário nfloor
cd ~/nfloor
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart nfloor
```

---

## 📊 Monitoramento

### Setup de Monitoramento Básico

```bash
# Instalar htop
sudo apt install htop

# Monitorar recursos
htop

# Monitorar PM2
pm2 monit
```

### Health Check Endpoint

Adicione este endpoint para monitorar a aplicação:

```bash
# Testar health check
curl https://nfloor.fluxos.co/api/health
```

---

## 🔄 Backup do Banco

```bash
# Criar backup
pg_dump -U nfloor_user -h localhost nfloor_prod > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U nfloor_user -h localhost nfloor_prod < backup_20260117.sql
```

---

## 📝 Checklist de Deploy

- [ ] Servidor configurado (Node, Nginx, PostgreSQL)
- [ ] Banco criado e usuário configurado
- [ ] Código clonado e dependências instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] Tabelas criadas (`prisma db push`)
- [ ] Dados iniciais populados (`npm run db:seed`)
- [ ] Build gerado (`npm run build`)
- [ ] PM2 configurado e rodando
- [ ] Nginx configurado
- [ ] SSL/HTTPS ativo
- [ ] DNS apontando para o servidor
- [ ] Teste de acesso funcionando

---

**Suporte:** Em caso de problemas, verifique os logs e a seção de troubleshooting acima.
