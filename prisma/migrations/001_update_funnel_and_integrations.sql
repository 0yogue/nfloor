-- ============================================================================
-- Migration: Update Sales Funnel Structure and Add Integrations
-- Date: 2026-01-26
-- Description: 
--   1. Updates LeadStatus enum: NEW+QUALIFIED -> LEAD, VISIT, CALLBACK (Retorno), PROPOSAL, SOLD, LOST
--   2. Adds LeadSource enum for tracking lead origin
--   3. Adds source and hubspot_id fields to Lead table
--   4. Creates CompanyIntegration table for API keys per company
-- ============================================================================

-- ============================================================================
-- STEP 1: Update LeadStatus enum
-- ============================================================================

-- Create new enum type
CREATE TYPE "LeadStatus_new" AS ENUM ('LEAD', 'VISIT', 'CALLBACK', 'PROPOSAL', 'SOLD', 'LOST');

-- Update existing leads: NEW and QUALIFIED become LEAD
UPDATE "Lead" SET status = 'LEAD' WHERE status IN ('NEW', 'QUALIFIED');

-- Alter column to use new enum (requires casting)
ALTER TABLE "Lead" 
  ALTER COLUMN status TYPE "LeadStatus_new" 
  USING (
    CASE 
      WHEN status::text IN ('NEW', 'QUALIFIED') THEN 'LEAD'::"LeadStatus_new"
      WHEN status::text = 'VISIT' THEN 'VISIT'::"LeadStatus_new"
      WHEN status::text = 'CALLBACK' THEN 'CALLBACK'::"LeadStatus_new"
      WHEN status::text = 'PROPOSAL' THEN 'PROPOSAL'::"LeadStatus_new"
      WHEN status::text = 'SOLD' THEN 'SOLD'::"LeadStatus_new"
      WHEN status::text = 'LOST' THEN 'LOST'::"LeadStatus_new"
      ELSE 'LEAD'::"LeadStatus_new"
    END
  );

-- Set default value
ALTER TABLE "Lead" ALTER COLUMN status SET DEFAULT 'LEAD'::"LeadStatus_new";

-- Drop old enum and rename new one
DROP TYPE "LeadStatus";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";

-- ============================================================================
-- STEP 2: Create LeadSource enum
-- ============================================================================

CREATE TYPE "LeadSource" AS ENUM (
  'EMAIL',
  'WHATSAPP', 
  'BALCAO',
  'CRM',
  'HUBSPOT',
  'ZAP_IMOVEIS',
  'OLX',
  'VIVA_REAL',
  'CHAVES_NA_MAO',
  'WEBSITE',
  'INDICATION',
  'OTHER'
);

-- ============================================================================
-- STEP 3: Add new columns to Lead table
-- ============================================================================

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "source" "LeadSource" DEFAULT 'OTHER';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "hubspot_id" VARCHAR(50);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "hubspot_synced_at" TIMESTAMP;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "company_name" VARCHAR(255);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "job_title" VARCHAR(255);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "website" VARCHAR(255);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "first_name" VARCHAR(100);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "last_name" VARCHAR(100);

-- Create index for HubSpot sync
CREATE INDEX IF NOT EXISTS "Lead_hubspot_id_idx" ON "Lead"("hubspot_id");
CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source");

-- ============================================================================
-- STEP 4: Create IntegrationType enum
-- ============================================================================

CREATE TYPE "IntegrationType" AS ENUM (
  'HUBSPOT',
  'EVOLUTION_API',
  'SMTP',
  'IMAP'
);

-- ============================================================================
-- STEP 5: Create CompanyIntegration table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CompanyIntegration" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "type" "IntegrationType" NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "api_key" TEXT,
  "api_url" TEXT,
  "config" JSONB DEFAULT '{}',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_sync_at" TIMESTAMP,
  "sync_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CompanyIntegration_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "CompanyIntegration" 
  ADD CONSTRAINT "CompanyIntegration_company_id_fkey" 
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "CompanyIntegration_company_id_idx" ON "CompanyIntegration"("company_id");
CREATE INDEX "CompanyIntegration_type_idx" ON "CompanyIntegration"("type");
CREATE UNIQUE INDEX "CompanyIntegration_company_id_type_key" ON "CompanyIntegration"("company_id", "type");

-- ============================================================================
-- STEP 6: Create HubSpotSyncLog table for tracking sync operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS "HubSpotSyncLog" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "direction" VARCHAR(10) NOT NULL, -- 'IMPORT' or 'EXPORT'
  "entity_type" VARCHAR(50) NOT NULL, -- 'CONTACT', 'DEAL', etc.
  "records_processed" INTEGER NOT NULL DEFAULT 0,
  "records_created" INTEGER NOT NULL DEFAULT 0,
  "records_updated" INTEGER NOT NULL DEFAULT 0,
  "records_failed" INTEGER NOT NULL DEFAULT 0,
  "error_details" JSONB,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "status" VARCHAR(20) NOT NULL DEFAULT 'RUNNING', -- 'RUNNING', 'COMPLETED', 'FAILED'

  CONSTRAINT "HubSpotSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HubSpotSyncLog_company_id_idx" ON "HubSpotSyncLog"("company_id");
CREATE INDEX "HubSpotSyncLog_started_at_idx" ON "HubSpotSyncLog"("started_at");

-- ============================================================================
-- End of Migration
-- ============================================================================
