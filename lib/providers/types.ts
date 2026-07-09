// Shared result and input types for all extraction providers.
// These are provider-layer types (not DB row types) — they represent
// data flowing through the provider pipeline before being persisted.

export interface ProgramSearchFilters {
  degree_type?: string
  location?: string
  field?: string
  keywords?: string
}

export interface DiscoveredProgram {
  name: string
  university: string
  degree_type: string
  location?: string
  website?: string
  description?: string
  match_score: number
  match_reason: string
}

export interface ExtractedRequirement {
  title: string
  requirement_type: string
  status: string
  deadline?: string
  source_url: string
  source_title?: string
  source_excerpt?: string
  source_type: string
  confidence_score: number
  official_domain_match: boolean
  extraction_method: string
  extracted_at: string
}

export interface ExtractedEssay {
  prompt_text?: string
  essay_type: string
  word_limit?: number
  character_limit?: number
  page_limit?: number
  deadline?: string
  portal_only: boolean
  source_url: string
  source_title?: string
  source_excerpt?: string
  source_type: string
  confidence_score: number
  official_domain_match: boolean
  extraction_method: string
  extracted_at: string
}

export interface SourceVerificationResult {
  is_official: boolean
  confidence_score: number
  official_domain_match: boolean
  source_title: string
  source_excerpt: string
  source_type: string
  verified_at: string
}

export interface FitScoreResult {
  overall_score: number
  gpa_fit: number
  test_score_fit: number
  research_fit: number
  experience_fit: number
  reasoning: string
  profile_gaps: string[]
  suggested_actions: string[]
}

export interface PromptGroup {
  group_name: string
  theme_key: string
  essay_ids: string[]
  programs: string[]
  prompts: string[]
  suggested_base: string
  adaptation_notes: string
  similarity_score: number
}

export interface ExtendedWorkloadSummary {
  // Existing fields (backward compatible with WorkloadSummary)
  total_essays: number
  total_requirements: number
  essays_not_started: number
  reqs_not_started: number
  estimated_hours: number
  busiest_week: string
  risk_level: "low" | "medium" | "high"
  // New fields
  total_programs: number
  unique_prompt_groups: number
  total_recommendations_needed: number
  deadlines_7d: number
  deadlines_14d: number
  deadlines_30d: number
  estimated_writing_hours: number
  programs_missing_sources: number
  low_confidence_items: number
  app_fees_total: string
  high_effort_programs: string[]
  quick_win_programs: string[]
}
