export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      applicant_profiles: {
        Row: ApplicantProfile
        Insert: Omit<ApplicantProfile, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<ApplicantProfile, "id">>
      }
      resumes: {
        Row: Resume
        Insert: Omit<Resume, "id" | "created_at">
        Update: Partial<Omit<Resume, "id">>
      }
      programs: {
        Row: Program
        Insert: Omit<Program, "id" | "created_at">
        Update: Partial<Omit<Program, "id">>
      }
      saved_programs: {
        Row: SavedProgram
        Insert: Omit<SavedProgram, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<SavedProgram, "id">>
      }
      program_requirements: {
        Row: ProgramRequirement
        Insert: Omit<ProgramRequirement, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<ProgramRequirement, "id">>
      }
      essay_requirements: {
        Row: EssayRequirement
        Insert: Omit<EssayRequirement, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<EssayRequirement, "id">>
      }
      prompt_evidence: {
        Row: PromptEvidence
        Insert: Omit<PromptEvidence, "id" | "uploaded_at">
        Update: Partial<Omit<PromptEvidence, "id">>
      }
      essay_drafts: {
        Row: EssayDraft
        Insert: Omit<EssayDraft, "id" | "created_at">
        Update: Partial<Omit<EssayDraft, "id">>
      }
      essay_draft_versions: {
        Row: EssayDraftVersion
        Insert: Omit<EssayDraftVersion, "id" | "created_at">
        Update: Partial<Omit<EssayDraftVersion, "id">>
      }
      recommendation_requests: {
        Row: RecommendationRequest
        Insert: Omit<RecommendationRequest, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<RecommendationRequest, "id">>
      }
      application_tasks: {
        Row: ApplicationTask
        Insert: Omit<ApplicationTask, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<ApplicationTask, "id">>
      }
      program_fit_scores: {
        Row: ProgramFitScore
        Insert: Omit<ProgramFitScore, "id" | "generated_at">
        Update: Partial<Omit<ProgramFitScore, "id">>
      }
      user_notes: {
        Row: UserNote
        Insert: Omit<UserNote, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<UserNote, "id">>
      }
      ai_extraction_runs: {
        Row: AIExtractionRun
        Insert: Omit<AIExtractionRun, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<AIExtractionRun, "id">>
      }
      ai_extracted_items: {
        Row: AIExtractedItem
        Insert: Omit<AIExtractedItem, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<AIExtractedItem, "id">>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export interface ApplicantProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  gpa: number | null
  gre_verbal: number | null
  gre_quant: number | null
  gre_writing: number | null
  gmat_score: number | null
  toefl_score: number | null
  ielts_score: number | null
  undergrad_institution: string | null
  undergrad_major: string | null
  undergrad_gpa: number | null
  work_experience_years: number | null
  research_experience: string | null
  skills: string[]
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Resume {
  id: string
  user_id: string
  file_name: string
  file_url: string | null
  raw_text: string | null
  parsed_json: Json | null
  is_primary: boolean
  created_at: string
}

export interface Program {
  id: string
  name: string
  university: string
  department: string | null
  degree_type: "BA" | "BS" | "BFA" | "BEng" | "BArch" | "BBA" | "BSN" | "BEd" | "MS" | "MA" | "MBA" | "MFA" | "MEng" | "MPH" | "MPS" | "MPA" | "MPP" | "MHA" | "MSW" | "MArch" | "PhD" | "JD" | "LLM" | "MD" | "DPT" | "DNP" | "EdD" | "Certificate" | "Post-Bacc" | "Other"
  location: string | null
  website: string | null
  description: string | null
  tuition_notes: string | null
  field_of_study: string | null
  created_at: string
}

export interface SavedProgram {
  id: string
  user_id: string
  program_id: string
  category: "Reach" | "Target" | "Safer"
  status: "planning" | "in_progress" | "submitted" | "accepted" | "rejected" | "withdrawn"
  deadline: string | null
  notes: string | null
  portal_url: string | null
  priority: number | null
  delivery_mode: "in_person" | "online" | "hybrid" | "unknown" | null
  app_fee: string | null
  created_at: string
  updated_at: string
  // joined
  program?: Program
}

export interface ProgramRequirement {
  id: string
  saved_program_id: string
  requirement_type: "transcript" | "test_score" | "lor" | "sop" | "resume" | "portfolio" | "other"
  title: string
  description: string | null
  status: "not_started" | "needed" | "requested" | "uploaded" | "verified" | "submitted" | "waived" | "not_applicable"
  deadline: string | null
  source_url: string | null
  source_excerpt: string | null
  source_type: "official" | "user_entered" | "portal_only" | "scraped" | "portal_entered" | "unknown"
  confidence_score: number
  user_verified: boolean
  portal_only: boolean
  notes: string | null
  source_title: string | null
  official_domain_match: boolean
  extraction_method: string | null
  extracted_at: string | null
  last_checked_at: string | null
  created_at: string
  updated_at: string
}

export interface EssayRequirement {
  id: string
  saved_program_id: string
  prompt_text: string | null
  essay_type: "sop" | "personal_statement" | "diversity" | "why_school" | "short_answer" | "other"
  word_limit: number | null
  character_limit: number | null
  page_limit: number | null
  deadline: string | null
  status: "not_started" | "outline" | "draft_1" | "revised" | "final" | "submitted"
  source_url: string | null
  source_excerpt: string | null
  source_type: "official" | "user_entered" | "portal_only" | "scraped" | "portal_entered" | "unknown"
  confidence_score: number
  user_verified: boolean
  portal_only: boolean
  notes: string | null
  source_title: string | null
  official_domain_match: boolean
  extraction_method: string | null
  extracted_at: string | null
  last_checked_at: string | null
  attached_file_url: string | null
  attached_file_name: string | null
  created_at: string
  updated_at: string
}

export interface PromptEvidence {
  id: string
  essay_requirement_id: string
  user_id: string
  file_name: string | null
  file_url: string | null
  file_type: "pdf" | "png" | "jpg" | "jpeg" | "webp" | "screenshot" | "other" | null
  notes: string | null
  uploaded_at: string
}

export interface EssayDraft {
  id: string
  essay_requirement_id: string
  user_id: string
  content: string
  word_count: number
  version_label: string
  is_current: boolean
  created_at: string
}

export interface EssayDraftVersion {
  id: string
  essay_draft_id: string
  content: string
  word_count: number
  created_at: string
}

export interface RecommendationRequest {
  id: string
  saved_program_id: string
  recommender_name: string
  recommender_email: string | null
  recommender_title: string | null
  institution: string | null
  relationship: string | null
  status: "not_asked" | "asked" | "confirmed" | "submitted" | "waived"
  deadline: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ApplicationTask {
  id: string
  user_id: string
  saved_program_id: string | null
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  priority: "low" | "medium" | "high"
  created_at: string
  updated_at: string
}

export interface ProgramFitScore {
  id: string
  user_id: string
  saved_program_id: string
  overall_score: number
  gpa_fit: number
  test_score_fit: number
  research_fit: number
  experience_fit: number
  reasoning: string
  generated_at: string
}

export interface UserNote {
  id: string
  user_id: string
  saved_program_id: string | null
  content: string
  created_at: string
  updated_at: string
}

export interface AIExtractionRun {
  id: string
  user_id: string
  saved_program_id: string
  input_text: string
  source_url: string | null
  source_type: string
  model_used: string | null
  extraction_status: "pending" | "extracting" | "completed" | "failed"
  extracted_json: unknown | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface AIExtractedItem {
  id: string
  extraction_run_id: string
  user_id: string
  saved_program_id: string
  item_type: "requirement" | "essay" | "deadline" | "fee" | "other"
  extracted_json: unknown
  confidence_score: number
  status: "pending" | "approved" | "rejected" | "edited" | "saved"
  created_at: string
  updated_at: string
}
