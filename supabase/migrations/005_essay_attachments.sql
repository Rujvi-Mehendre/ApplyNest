-- Attach a file (PDF/DOC) directly to an essay entry
ALTER TABLE essay_requirements
  ADD COLUMN IF NOT EXISTS attached_file_url TEXT,
  ADD COLUMN IF NOT EXISTS attached_file_name TEXT;
