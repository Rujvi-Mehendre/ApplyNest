-- Auto-timestamp helper (idempotent — safe to run even if already defined)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- AI extraction run log: one row per paste-and-extract attempt
CREATE TABLE IF NOT EXISTS ai_extraction_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_program_id UUID NOT NULL REFERENCES saved_programs(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'unknown',
  model_used TEXT,
  extraction_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN ('pending','extracting','completed','failed')),
  extracted_json JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual extracted items awaiting user review/approval
CREATE TABLE IF NOT EXISTS ai_extracted_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extraction_run_id UUID NOT NULL REFERENCES ai_extraction_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_program_id UUID NOT NULL REFERENCES saved_programs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('requirement','essay','deadline','fee','other')),
  extracted_json JSONB NOT NULL,
  confidence_score NUMERIC(4,3) DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','edited','saved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_extraction_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_extracted_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own extraction runs" ON ai_extraction_runs;
DROP POLICY IF EXISTS "Users manage own extracted items" ON ai_extracted_items;

CREATE POLICY "Users manage own extraction runs" ON ai_extraction_runs FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "Users manage own extracted items" ON ai_extracted_items FOR ALL
  USING (user_id = auth.uid());

-- Auto-update timestamps
DROP TRIGGER IF EXISTS update_ai_extraction_runs_updated_at ON ai_extraction_runs;
DROP TRIGGER IF EXISTS update_ai_extracted_items_updated_at ON ai_extracted_items;

CREATE TRIGGER update_ai_extraction_runs_updated_at
  BEFORE UPDATE ON ai_extraction_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_extracted_items_updated_at
  BEFORE UPDATE ON ai_extracted_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
