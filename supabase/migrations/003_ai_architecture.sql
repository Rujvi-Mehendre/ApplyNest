-- Migration 003: AI-Ready Extraction Architecture
-- Run this in the Supabase SQL editor after migration 002.

-- ─── Extend source_type enums ───────────────────────────────────────────────

-- program_requirements: add portal_entered and unknown
ALTER TABLE program_requirements DROP CONSTRAINT IF EXISTS program_requirements_source_type_check;
ALTER TABLE program_requirements
  ADD CONSTRAINT program_requirements_source_type_check
  CHECK (source_type IN ('official','user_entered','portal_only','scraped','portal_entered','unknown'));

-- essay_requirements: add portal_entered and unknown
ALTER TABLE essay_requirements DROP CONSTRAINT IF EXISTS essay_requirements_source_type_check;
ALTER TABLE essay_requirements
  ADD CONSTRAINT essay_requirements_source_type_check
  CHECK (source_type IN ('official','user_entered','portal_only','scraped','portal_entered','unknown'));

-- ─── Extraction metadata: program_requirements ───────────────────────────────

ALTER TABLE program_requirements
  ADD COLUMN IF NOT EXISTS source_title TEXT,
  ADD COLUMN IF NOT EXISTS official_domain_match BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS extraction_method TEXT
    CHECK (extraction_method IN ('manual','ai_extracted','url_scrape','portal_entered','imported')),
  ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- ─── Extraction metadata: essay_requirements ─────────────────────────────────

ALTER TABLE essay_requirements
  ADD COLUMN IF NOT EXISTS source_title TEXT,
  ADD COLUMN IF NOT EXISTS official_domain_match BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS extraction_method TEXT
    CHECK (extraction_method IN ('manual','ai_extracted','url_scrape','portal_entered','imported')),
  ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- ─── New table: prompt_evidence ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prompt_evidence (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_requirement_id UUID NOT NULL REFERENCES essay_requirements(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name      TEXT,
  file_url       TEXT,  -- Supabase Storage path — requires 'prompt-evidence' bucket (see PortalPromptDialog TODO)
  file_type      TEXT CHECK (file_type IN ('pdf','png','jpg','jpeg','webp','screenshot','other')),
  notes          TEXT,
  uploaded_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prompt_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prompt evidence" ON prompt_evidence FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM essay_requirements er
      JOIN saved_programs sp ON sp.id = er.saved_program_id
      WHERE er.id = essay_requirement_id AND sp.user_id = auth.uid()
    )
  );
