// TODO: Replace with a real RequirementExtractionProvider backed by
// a web scraper + LLM structured output (see lib/providers/index.ts).

import type { RequirementExtractionProvider } from "../interfaces"
import type { ExtractedRequirement } from "../types"

const now = () => new Date().toISOString()

function mockRequirements(sourceUrl: string): ExtractedRequirement[] {
  return [
    {
      title: "Official Transcripts",
      requirement_type: "transcript",
      status: "not_started",
      source_url: sourceUrl,
      source_title: "Admissions Requirements — Graduate Programs",
      source_excerpt: "All applicants must submit official transcripts from each college or university attended.",
      source_type: "official",
      confidence_score: 0.92,
      official_domain_match: true,
      extraction_method: "ai_extracted",
      extracted_at: now(),
    },
    {
      title: "Letter of Recommendation #1",
      requirement_type: "lor",
      status: "not_started",
      source_url: sourceUrl,
      source_title: "Admissions Requirements — Graduate Programs",
      source_excerpt: "Three letters of recommendation are required from academic or professional references.",
      source_type: "official",
      confidence_score: 0.90,
      official_domain_match: true,
      extraction_method: "ai_extracted",
      extracted_at: now(),
    },
    {
      title: "Letter of Recommendation #2",
      requirement_type: "lor",
      status: "not_started",
      source_url: sourceUrl,
      source_title: "Admissions Requirements — Graduate Programs",
      source_excerpt: "Three letters of recommendation are required from academic or professional references.",
      source_type: "official",
      confidence_score: 0.90,
      official_domain_match: true,
      extraction_method: "ai_extracted",
      extracted_at: now(),
    },
    {
      title: "Letter of Recommendation #3",
      requirement_type: "lor",
      status: "not_started",
      source_url: sourceUrl,
      source_title: "Admissions Requirements — Graduate Programs",
      source_excerpt: "Three letters of recommendation are required from academic or professional references.",
      source_type: "official",
      confidence_score: 0.90,
      official_domain_match: true,
      extraction_method: "ai_extracted",
      extracted_at: now(),
    },
    {
      title: "Statement of Purpose",
      requirement_type: "sop",
      status: "not_started",
      source_url: sourceUrl,
      source_title: "Application Instructions",
      source_excerpt: "Submit a statement of purpose (maximum 1000 words) describing your academic background and research goals.",
      source_type: "official",
      confidence_score: 0.88,
      official_domain_match: true,
      extraction_method: "ai_extracted",
      extracted_at: now(),
    },
    {
      title: "CV / Resume",
      requirement_type: "resume",
      status: "not_started",
      source_url: sourceUrl,
      source_title: "Application Instructions",
      source_excerpt: "Upload a current curriculum vitae or resume.",
      source_type: "official",
      confidence_score: 0.95,
      official_domain_match: true,
      extraction_method: "ai_extracted",
      extracted_at: now(),
    },
  ]
}

export class MockRequirementExtractionProvider implements RequirementExtractionProvider {
  // TODO: Implement with Playwright/Puppeteer scraping + Claude structured output
  async extractRequirements(
    programUrl: string,
    _applicationUrl?: string
  ): Promise<ExtractedRequirement[]> {
    return mockRequirements(programUrl)
  }

  normalizeRequirements(raw: ExtractedRequirement[]): ExtractedRequirement[] {
    return raw.map(r => ({
      ...r,
      title: r.title.trim(),
      source_excerpt: r.source_excerpt?.trim().slice(0, 500) ?? undefined,
    }))
  }

  identifyMissingRequirementFields(requirements: ExtractedRequirement[]): string[] {
    const missing: string[] = []
    for (const r of requirements) {
      if (!r.title) missing.push(`Requirement missing title`)
      if (!r.deadline) missing.push(`"${r.title}" has no deadline`)
      if (!r.source_url) missing.push(`"${r.title}" has no source URL`)
    }
    return missing
  }
}
