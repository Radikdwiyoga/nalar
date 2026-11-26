-- ============================================================
-- Migration: Sync artifact_kind ('action_items') & Notebook Sharing Columns
-- ============================================================

-- 1. Ensure all extended artifact_kind enum values exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'comparison' AND enumtypid = 'artifact_kind'::regtype) THEN
    ALTER TYPE artifact_kind ADD VALUE 'comparison';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'audio_overview' AND enumtypid = 'artifact_kind'::regtype) THEN
    ALTER TYPE artifact_kind ADD VALUE 'audio_overview';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'action_items' AND enumtypid = 'artifact_kind'::regtype) THEN
    ALTER TYPE artifact_kind ADD VALUE 'action_items';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add explicit public sharing columns on notebooks
ALTER TABLE notebooks
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_token text;

CREATE UNIQUE INDEX IF NOT EXISTS notebooks_share_token_idx
  ON notebooks (share_token)
  WHERE share_token IS NOT NULL;

-- 3. Migrate any legacy JSON _meta stored in description into the proper columns
UPDATE notebooks
SET
  is_public = COALESCE((description::jsonb ->> 'isPublic')::boolean, false),
  share_token = NULLIF(description::jsonb ->> 'shareToken', ''),
  description = NULLIF(description::jsonb ->> 'textDescription', '')
WHERE description IS NOT NULL
  AND description LIKE '{"_meta":true%';
