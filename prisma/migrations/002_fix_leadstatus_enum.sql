-- ============================================================================
-- Migration FIX: LeadStatus enum conversion (safe after partial execution)
-- Date: 2026-01-26
--
-- This migration fixes the initial enum migration by:
-- - Dropping the existing default before type conversion
-- - Converting values NEW/QUALIFIED -> LEAD during the ALTER TYPE
-- - Handling cases where the previous migration ran partially
-- ============================================================================

DO $$
DECLARE
  status_type text;
  has_new_label boolean;
  has_qualified_label boolean;
BEGIN
  SELECT a.atttypid::regtype::text
    INTO status_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'Lead'
    AND n.nspname = 'public'
    AND a.attname = 'status'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF status_type IS NULL THEN
    RAISE NOTICE 'Lead.status column not found. Skipping.';
    RETURN;
  END IF;

  -- Detect if current LeadStatus still has NEW/QUALIFIED (old enum)
  SELECT EXISTS(
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'LeadStatus'
      AND e.enumlabel = 'NEW'
  ) INTO has_new_label;

  SELECT EXISTS(
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'LeadStatus'
      AND e.enumlabel = 'QUALIFIED'
  ) INTO has_qualified_label;

  IF has_new_label OR has_qualified_label THEN
    -- Drop default before changing enum type
    EXECUTE 'ALTER TABLE "Lead" ALTER COLUMN status DROP DEFAULT';

    -- Create new enum type if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadStatus_new') THEN
      EXECUTE 'CREATE TYPE "LeadStatus_new" AS ENUM (''LEAD'', ''VISIT'', ''CALLBACK'', ''PROPOSAL'', ''SOLD'', ''LOST'')';
    END IF;

    -- Convert column to new enum with mapping
    EXECUTE '
      ALTER TABLE "Lead"
        ALTER COLUMN status TYPE "LeadStatus_new"
        USING (
          CASE
            WHEN status::text IN (''NEW'', ''QUALIFIED'') THEN ''LEAD''::"LeadStatus_new"
            WHEN status::text = ''VISIT'' THEN ''VISIT''::"LeadStatus_new"
            WHEN status::text = ''CALLBACK'' THEN ''CALLBACK''::"LeadStatus_new"
            WHEN status::text = ''PROPOSAL'' THEN ''PROPOSAL''::"LeadStatus_new"
            WHEN status::text = ''SOLD'' THEN ''SOLD''::"LeadStatus_new"
            WHEN status::text = ''LOST'' THEN ''LOST''::"LeadStatus_new"
            ELSE ''LEAD''::"LeadStatus_new"
          END
        )
    ';

    EXECUTE 'ALTER TABLE "Lead" ALTER COLUMN status SET DEFAULT ''LEAD''::"LeadStatus_new"';

    -- Now old LeadStatus type is no longer referenced by Lead.status
    EXECUTE 'DROP TYPE "LeadStatus"';
    EXECUTE 'ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus"';

    EXECUTE 'ALTER TABLE "Lead" ALTER COLUMN status SET DEFAULT ''LEAD''::"LeadStatus"';

    RAISE NOTICE 'LeadStatus enum successfully converted to new structure.';
  ELSE
    RAISE NOTICE 'LeadStatus enum already converted (no NEW/QUALIFIED). Skipping.';
  END IF;
END $$;
