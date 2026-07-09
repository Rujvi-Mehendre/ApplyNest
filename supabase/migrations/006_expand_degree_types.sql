-- Expand degree_type to cover bachelor's, professional, certificate, and arts programs
ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_degree_type_check;
ALTER TABLE programs ADD CONSTRAINT programs_degree_type_check
  CHECK (degree_type IN (
    -- Bachelor's
    'BA', 'BS', 'BFA', 'BEng', 'BArch', 'BBA', 'BSN', 'BEd',
    -- Master's
    'MS', 'MA', 'MBA', 'MFA', 'MEng', 'MPH', 'MPS', 'MPA', 'MPP', 'MHA', 'MSW', 'MArch',
    -- Doctorate / Professional
    'PhD', 'JD', 'LLM', 'MD', 'DPT', 'DNP', 'EdD',
    -- Other
    'Certificate', 'Post-Bacc', 'Other'
  ));
