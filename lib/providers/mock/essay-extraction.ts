// TODO: Replace with a real EssayExtractionProvider backed by
// a web scraper + LLM classification (see lib/providers/index.ts).

import type { EssayExtractionProvider } from "../interfaces"
import type { ExtractedEssay } from "../types"
import type { EssayRequirement } from "@/lib/supabase/types"

const now = () => new Date().toISOString()

const ESSAY_TYPE_KEYWORDS: Record<EssayRequirement["essay_type"], string[]> = {
  sop: ["research", "academic", "goals", "pursue", "phd", "graduate", "field of study", "scholarly"],
  personal_statement: ["background", "journey", "personal", "experience", "shaped", "story"],
  why_school: ["why", "school", "program", "faculty", "lab", "opportunity", "community", "specific"],
  diversity: ["diversity", "inclusion", "underrepresented", "perspective", "background", "community"],
  short_answer: ["briefly", "words or less", "short", "describe in", "list"],
  other: [],
}

function classifyByKeywords(prompt: string): EssayRequirement["essay_type"] {
  const lower = prompt.toLowerCase()
  const scores: Record<string, number> = {}
  for (const [type, keywords] of Object.entries(ESSAY_TYPE_KEYWORDS)) {
    scores[type] = keywords.filter(k => lower.includes(k)).length
  }
  const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0]
  return (best?.[1] > 0 ? best[0] : "other") as EssayRequirement["essay_type"]
}

function mockEssays(sourceUrl: string): ExtractedEssay[] {
  return [
    {
      prompt_text: "Please describe your academic background, research experience, and how a graduate degree from our program aligns with your long-term professional goals. (Max 1000 words)",
      essay_type: "sop",
      word_limit: 1000,
      portal_only: false,
      source_url: sourceUrl,
      source_title: "Application Instructions — Essay Requirements",
      source_excerpt: "Describe your academic background, research experience, and professional goals.",
      source_type: "official",
      confidence_score: 0.87,
      official_domain_match: true,
      extraction_method: "ai_extracted",
      extracted_at: now(),
    },
    {
      prompt_text: "Why are you applying to this specific program? Mention specific faculty, research groups, or resources that drew you here. (Max 500 words)",
      essay_type: "why_school",
      word_limit: 500,
      portal_only: false,
      source_url: sourceUrl,
      source_title: "Application Instructions — Essay Requirements",
      source_excerpt: "Why are you applying to this specific program?",
      source_type: "official",
      confidence_score: 0.83,
      official_domain_match: true,
      extraction_method: "ai_extracted",
      extracted_at: now(),
    },
    {
      portal_only: true,
      essay_type: "other",
      source_url: sourceUrl,
      source_title: "Application Portal",
      source_excerpt: "Additional questions visible only after creating an application account.",
      source_type: "portal_only",
      confidence_score: 0.45,
      official_domain_match: false,
      extraction_method: "ai_extracted",
      extracted_at: now(),
    },
  ]
}

export class MockEssayExtractionProvider implements EssayExtractionProvider {
  // TODO: Implement with Playwright/Puppeteer scraping + Claude structured output
  async extractEssayRequirements(
    programUrl: string,
    _applicationUrl?: string
  ): Promise<ExtractedEssay[]> {
    return mockEssays(programUrl)
  }

  identifyPortalOnlyPrompts(extractedData: ExtractedEssay[]): ExtractedEssay[] {
    return extractedData.filter(e => e.portal_only || !e.prompt_text)
  }

  // TODO: Replace with LLM normalization (fix encoding, remove HTML artifacts, standardize whitespace)
  normalizeEssayPrompt(rawPrompt: string): string {
    return rawPrompt
      .replace(/\s+/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&#\d+;/g, "")
      .trim()
  }

  // TODO: Replace with LLM classification for nuanced essay type detection
  classifyEssayType(prompt: string): EssayRequirement["essay_type"] {
    return classifyByKeywords(prompt)
  }
}

export { classifyByKeywords }
