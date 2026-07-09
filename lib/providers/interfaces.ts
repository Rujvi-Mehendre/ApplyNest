// Provider interfaces for the AI-ready extraction architecture.
// Each interface defines the contract for a specific AI/extraction capability.
// Swap mock implementations for real ones in lib/providers/index.ts.

import type { ApplicantProfile, Program, ProgramRequirement, EssayRequirement } from "@/lib/supabase/types"
import type {
  ProgramSearchFilters,
  DiscoveredProgram,
  ExtractedRequirement,
  ExtractedEssay,
  SourceVerificationResult,
  FitScoreResult,
  PromptGroup,
} from "./types"

// 1. Program Discovery
// Purpose: Search for programs matching an applicant's profile and goals.
// TODO: Implement with a real LLM + program database when ready.
export interface ProgramDiscoveryProvider {
  searchPrograms(
    filters: ProgramSearchFilters,
    applicantProfile: Partial<ApplicantProfile>
  ): Promise<DiscoveredProgram[]>
  getProgramDetails(programUrl: string): Promise<Partial<Program>>
  rankPrograms(
    programs: DiscoveredProgram[],
    applicantProfile: Partial<ApplicantProfile>
  ): Promise<DiscoveredProgram[]>
}

// 2. Requirement Extraction
// Purpose: Extract application requirements from official program or admissions pages.
// TODO: Implement with a web scraper + LLM structured output.
export interface RequirementExtractionProvider {
  extractRequirements(
    programUrl: string,
    applicationUrl?: string
  ): Promise<ExtractedRequirement[]>
  normalizeRequirements(raw: ExtractedRequirement[]): ExtractedRequirement[]
  identifyMissingRequirementFields(requirements: ExtractedRequirement[]): string[]
}

// 3. Essay Extraction
// Purpose: Extract exact essay prompts and essay-related requirements.
// TODO: Implement with a web scraper + LLM classification.
export interface EssayExtractionProvider {
  extractEssayRequirements(
    programUrl: string,
    applicationUrl?: string
  ): Promise<ExtractedEssay[]>
  identifyPortalOnlyPrompts(extractedData: ExtractedEssay[]): ExtractedEssay[]
  normalizeEssayPrompt(rawPrompt: string): string
  classifyEssayType(prompt: string): EssayRequirement["essay_type"]
}

// 4. Source Verification
// Purpose: Score sources and determine whether requirements are trustworthy.
// TODO: Implement with domain verification + LLM reasoning.
export interface SourceVerificationProvider {
  verifySource(
    sourceUrl: string,
    universityName: string
  ): Promise<SourceVerificationResult>
  calculateConfidenceScore(
    source: SourceVerificationResult,
    extractedText: string
  ): number
  detectOfficialSource(sourceUrl: string, universityName: string): boolean
  flagLowConfidenceItems(
    requirements: (ProgramRequirement | EssayRequirement)[]
  ): string[]
}

// 5. Fit Scoring
// Purpose: Score programs as Reach, Target, or Safer and explain the reasoning.
// TODO: Implement with LLM structured scoring prompt using profile + program data.
export interface FitScoringProvider {
  scoreProgramFit(
    applicantProfile: Partial<ApplicantProfile>,
    program: Program,
    requirements?: ProgramRequirement[]
  ): Promise<FitScoreResult>
  explainFitScore(score: FitScoreResult): string
  identifyProfileGaps(
    applicantProfile: Partial<ApplicantProfile>,
    program: Program
  ): string[]
  suggestProfileActions(
    applicantProfile: Partial<ApplicantProfile>,
    program: Program
  ): string[]
}

// 6. Essay Similarity
// Purpose: Group similar essay prompts to surface reuse opportunities.
// TODO: Implement with semantic embeddings (e.g. Anthropic or sentence-transformers).
export interface EssaySimilarityProvider {
  detectSimilarPrompts(essayRequirements: EssayRequirement[]): PromptGroup[]
  createPromptGroups(essayRequirements: EssayRequirement[]): PromptGroup[]
  suggestReusableDrafts(promptGroups: PromptGroup[]): Record<string, string>
  generateAdaptationNotes(promptGroup: PromptGroup): string
}
