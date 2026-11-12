-- Migration: Add 'comparison' and 'audio_overview' to artifact_kind enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'comparison' AND enumtypid = 'artifact_kind'::regtype) THEN
    ALTER TYPE artifact_kind ADD VALUE 'comparison';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'audio_overview' AND enumtypid = 'artifact_kind'::regtype) THEN
    ALTER TYPE artifact_kind ADD VALUE 'audio_overview';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
