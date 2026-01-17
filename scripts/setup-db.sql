-- ============================================================================
-- NFloor - PostgreSQL Database Setup Script
-- Execute como superusuário (postgres): psql -U postgres -f setup-db.sql
-- ============================================================================

-- 1. Criar usuário da aplicação
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nfloor_user') THEN
        CREATE USER nfloor_user WITH PASSWORD 'nfloor_password_2024';
    END IF;
END
$$;

-- 2. Criar banco de dados
SELECT 'CREATE DATABASE nfloor OWNER nfloor_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nfloor')\gexec

-- 3. Conectar ao banco nfloor e dar permissões
\c nfloor

-- 4. Dar permissões ao usuário
GRANT ALL PRIVILEGES ON DATABASE nfloor TO nfloor_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO nfloor_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nfloor_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nfloor_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nfloor_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nfloor_user;

-- 5. Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Pronto! Use a seguinte DATABASE_URL no .env:
-- DATABASE_URL="postgresql://nfloor_user:nfloor_password_2024@localhost:5432/nfloor"
-- ============================================================================
