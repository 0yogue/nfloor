-- =============================================================================
-- NFloor - Script SQL Completo de Inicialização do Banco
-- Execute este script em um banco PostgreSQL limpo
-- =============================================================================

-- Criar tipos ENUM
CREATE TYPE "LicenseType" AS ENUM ('BASIC', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "AccessLevel" AS ENUM ('SUPER_ADMIN', 'DIRECTOR', 'SUPERINTENDENT', 'MANAGER', 'SELLER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'CALLBACK', 'PROPOSAL', 'SOLD', 'LOST');
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'WAITING_RESPONSE', 'CLOSED', 'ARCHIVED');
CREATE TYPE "SenderType" AS ENUM ('SELLER', 'LEAD', 'SYSTEM');

-- =============================================================================
-- TABELA: Company
-- =============================================================================
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "license_type" "LicenseType" NOT NULL DEFAULT 'BASIC',
    "license_expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
CREATE INDEX "Company_license_type_idx" ON "Company"("license_type");
CREATE INDEX "Company_is_active_idx" ON "Company"("is_active");

-- =============================================================================
-- TABELA: Area
-- =============================================================================
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Area_company_id_name_key" ON "Area"("company_id", "name");
CREATE INDEX "Area_company_id_idx" ON "Area"("company_id");
CREATE INDEX "Area_is_active_idx" ON "Area"("is_active");

ALTER TABLE "Area" ADD CONSTRAINT "Area_company_id_fkey" 
    FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- TABELA: User
-- =============================================================================
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "access_level" "AccessLevel" NOT NULL DEFAULT 'SELLER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "company_id" TEXT,
    "area_id" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_company_id_access_level_idx" ON "User"("company_id", "access_level");
CREATE INDEX "User_area_id_idx" ON "User"("area_id");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_email_idx" ON "User"("email");

ALTER TABLE "User" ADD CONSTRAINT "User_company_id_fkey" 
    FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_area_id_fkey" 
    FOREIGN KEY ("area_id") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- TABELA: AreaManager
-- =============================================================================
CREATE TABLE "AreaManager" (
    "user_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AreaManager_pkey" PRIMARY KEY ("user_id", "area_id")
);

CREATE INDEX "AreaManager_area_id_idx" ON "AreaManager"("area_id");

ALTER TABLE "AreaManager" ADD CONSTRAINT "AreaManager_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AreaManager" ADD CONSTRAINT "AreaManager_area_id_fkey" 
    FOREIGN KEY ("area_id") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- TABELA: Lead
-- =============================================================================
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "seller_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_seller_id_idx" ON "Lead"("seller_id");
CREATE INDEX "Lead_area_id_idx" ON "Lead"("area_id");
CREATE INDEX "Lead_company_id_idx" ON "Lead"("company_id");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_created_at_idx" ON "Lead"("created_at");

-- =============================================================================
-- TABELA: Session
-- =============================================================================
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_heartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_token_hash_key" ON "Session"("token_hash");
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");
CREATE INDEX "Session_expires_at_idx" ON "Session"("expires_at");
CREATE INDEX "Session_is_online_idx" ON "Session"("is_online");

ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- TABELA: Conversation
-- =============================================================================
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "whatsapp_chat_id" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_message_at" TIMESTAMP(3),
    "last_seller_message" TIMESTAMP(3),
    "last_lead_message" TIMESTAMP(3),
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_lead_id_seller_id_key" ON "Conversation"("lead_id", "seller_id");
CREATE INDEX "Conversation_seller_id_idx" ON "Conversation"("seller_id");
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");
CREATE INDEX "Conversation_last_message_at_idx" ON "Conversation"("last_message_at");

-- =============================================================================
-- TABELA: Message
-- =============================================================================
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_type" "SenderType" NOT NULL,
    "content" TEXT NOT NULL,
    "whatsapp_id" TEXT,
    "response_time" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_conversation_id_idx" ON "Message"("conversation_id");
CREATE INDEX "Message_sender_type_idx" ON "Message"("sender_type");
CREATE INDEX "Message_created_at_idx" ON "Message"("created_at");

ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" 
    FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- TABELA: PlaybookScore
-- =============================================================================
CREATE TABLE "PlaybookScore" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "criteria" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaybookScore_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlaybookScore_seller_id_idx" ON "PlaybookScore"("seller_id");
CREATE INDEX "PlaybookScore_conversation_id_idx" ON "PlaybookScore"("conversation_id");
CREATE INDEX "PlaybookScore_created_at_idx" ON "PlaybookScore"("created_at");

ALTER TABLE "PlaybookScore" ADD CONSTRAINT "PlaybookScore_conversation_id_fkey" 
    FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- TABELA: Playbook
-- =============================================================================
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Playbook_company_id_idx" ON "Playbook"("company_id");
CREATE INDEX "Playbook_is_active_idx" ON "Playbook"("is_active");

-- =============================================================================
-- DADOS INICIAIS
-- Senha para todos: 123456 (hash bcrypt)
-- =============================================================================

-- Empresa NFloor (Super Admin)
INSERT INTO "Company" ("id", "name", "slug", "license_type", "is_active")
VALUES ('comp_nfloor', 'NFloor', 'nfloor', 'ENTERPRISE', true);

-- Empresa Demo
INSERT INTO "Company" ("id", "name", "slug", "license_type", "is_active")
VALUES ('comp_demo', 'Imobiliária Demo', 'imobiliaria-demo', 'PROFESSIONAL', true);

-- Áreas da Demo
INSERT INTO "Area" ("id", "name", "company_id", "is_active")
VALUES ('area_vendas', 'Vendas', 'comp_demo', true);

INSERT INTO "Area" ("id", "name", "company_id", "is_active")
VALUES ('area_locacao', 'Locação', 'comp_demo', true);

-- Usuários (senha: 123456)
-- Hash bcrypt de "123456"
-- $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4C4OAx1Ld7FQKlGm

INSERT INTO "User" ("id", "email", "password_hash", "name", "access_level", "status", "company_id")
VALUES ('user_admin', 'admin@nfloor.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4C4OAx1Ld7FQKlGm', 'Super Admin', 'SUPER_ADMIN', 'ACTIVE', 'comp_nfloor');

INSERT INTO "User" ("id", "email", "password_hash", "name", "access_level", "status", "company_id")
VALUES ('user_diretor', 'diretor@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4C4OAx1Ld7FQKlGm', 'Carlos Diretor', 'DIRECTOR', 'ACTIVE', 'comp_demo');

INSERT INTO "User" ("id", "email", "password_hash", "name", "access_level", "status", "company_id", "area_id")
VALUES ('user_super', 'superintendente@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4C4OAx1Ld7FQKlGm', 'Ana Superintendente', 'SUPERINTENDENT', 'ACTIVE', 'comp_demo', 'area_vendas');

INSERT INTO "User" ("id", "email", "password_hash", "name", "access_level", "status", "company_id", "area_id")
VALUES ('user_gerente', 'gerente@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4C4OAx1Ld7FQKlGm', 'Roberto Gerente', 'MANAGER', 'ACTIVE', 'comp_demo', 'area_vendas');

INSERT INTO "User" ("id", "email", "password_hash", "name", "access_level", "status", "company_id", "area_id")
VALUES ('user_vendedor1', 'vendedor1@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4C4OAx1Ld7FQKlGm', 'Maria Vendedora', 'SELLER', 'ACTIVE', 'comp_demo', 'area_vendas');

INSERT INTO "User" ("id", "email", "password_hash", "name", "access_level", "status", "company_id", "area_id")
VALUES ('user_vendedor2', 'vendedor2@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4C4OAx1Ld7FQKlGm', 'João Vendedor', 'SELLER', 'ACTIVE', 'comp_demo', 'area_locacao');

-- Áreas gerenciadas
INSERT INTO "AreaManager" ("user_id", "area_id")
VALUES ('user_super', 'area_vendas');

INSERT INTO "AreaManager" ("user_id", "area_id")
VALUES ('user_super', 'area_locacao');

INSERT INTO "AreaManager" ("user_id", "area_id")
VALUES ('user_gerente', 'area_vendas');

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================

-- Verificação
SELECT 'Empresas criadas: ' || COUNT(*) FROM "Company";
SELECT 'Áreas criadas: ' || COUNT(*) FROM "Area";
SELECT 'Usuários criados: ' || COUNT(*) FROM "User";
