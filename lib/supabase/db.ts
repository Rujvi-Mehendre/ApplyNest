// Typed query helpers — cast Supabase results to our own types.
// These wrappers exist so the rest of the app stays typed even before
// the Supabase project is live and types are generated.

import type {
  SavedProgram, Program, ProgramRequirement, EssayRequirement,
  ApplicantProfile, RecommendationRequest, ProgramFitScore, UserNote, PromptEvidence,
  AIExtractionRun, AIExtractedItem
} from "./types"

type WithProgram = SavedProgram & { program: Program }

export function castSavedPrograms(data: unknown): WithProgram[] {
  return (data as WithProgram[]) ?? []
}

export function castProfile(data: unknown): ApplicantProfile | null {
  return (data as ApplicantProfile | null) ?? null
}

export function castRequirements(data: unknown): (ProgramRequirement & { saved_program?: { user_id: string; category?: string; program?: { university: string; name: string } } })[] {
  return (data as ReturnType<typeof castRequirements>) ?? []
}

export function castEssays(data: unknown): (EssayRequirement & { saved_program?: { user_id: string; category?: string; program?: { university: string; name: string } } })[] {
  return (data as ReturnType<typeof castEssays>) ?? []
}

export function castRecs(data: unknown): RecommendationRequest[] {
  return (data as RecommendationRequest[]) ?? []
}

export function castFitScore(data: unknown): ProgramFitScore | null {
  return (data as ProgramFitScore | null) ?? null
}

export function castNote(data: unknown): UserNote | null {
  return (data as UserNote | null) ?? null
}

export function castPromptEvidence(data: unknown): PromptEvidence[] {
  return (data as PromptEvidence[]) ?? []
}

export function castExtractionRun(data: unknown): AIExtractionRun | null {
  return (data as AIExtractionRun | null) ?? null
}

export function castExtractedItems(data: unknown): AIExtractedItem[] {
  return (data as AIExtractedItem[]) ?? []
}
