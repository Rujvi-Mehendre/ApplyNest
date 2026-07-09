import { z } from "zod"

export const RequirementItemSchema = z.object({
  item_type: z.literal("requirement"),
  requirement_type: z.enum(["transcript", "test_score", "lor", "sop", "resume", "portfolio", "other"]),
  title: z.string(),
  description: z.string().nullable(),
  is_required: z.boolean().default(true),
  deadline: z.string().nullable(),
  source_excerpt: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
  extraction_notes: z.string().nullable(),
})

export const EssayItemSchema = z.object({
  item_type: z.literal("essay"),
  essay_type: z.enum(["sop", "personal_statement", "diversity", "why_school", "short_answer", "other"]),
  title: z.string(),
  exact_prompt: z.string().nullable(),
  portal_only: z.boolean().default(false),
  word_limit: z.number().nullable(),
  character_limit: z.number().nullable(),
  page_limit: z.number().nullable(),
  deadline: z.string().nullable(),
  source_excerpt: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
  extraction_notes: z.string().nullable(),
})

export const ExtractionResultSchema = z.object({
  requirements: z.array(RequirementItemSchema),
  essays: z.array(EssayItemSchema),
  summary: z.string(),
})

export type RequirementItem = z.infer<typeof RequirementItemSchema>
export type EssayItem = z.infer<typeof EssayItemSchema>
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>
export type ExtractedItem = RequirementItem | EssayItem
