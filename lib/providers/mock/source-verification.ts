// TODO: Replace with a real SourceVerificationProvider backed by
// domain lookup + LLM-based content verification (see lib/providers/index.ts).

import type { SourceVerificationProvider } from "../interfaces"
import type { SourceVerificationResult } from "../types"
import type { ProgramRequirement, EssayRequirement } from "@/lib/supabase/types"

const now = () => new Date().toISOString()

// Confidence scoring rules (from spec):
// 0.90–1.00: official admissions/program page with direct requirement or exact essay prompt
// 0.75–0.89: official page with related but indirect requirement
// 0.50–0.74: unofficial source or unclear wording
// 0.25–0.49: inferred requirement
// below 0.25: unknown or missing source

const OFFICIAL_TLD_PATTERNS = [".edu", ".ac.uk", ".ac.jp", ".edu.au"]
const OFFICIAL_PATH_PATTERNS = ["admissions", "apply", "graduate", "programs", "academics"]

export class MockSourceVerificationProvider implements SourceVerificationProvider {
  // TODO: Implement with real HTTP fetch + domain registration lookup + LLM page analysis
  async verifySource(sourceUrl: string, universityName: string): Promise<SourceVerificationResult> {
    const isOfficial = this.detectOfficialSource(sourceUrl, universityName)
    const confidence = isOfficial ? 0.90 + Math.random() * 0.09 : 0.50 + Math.random() * 0.2
    return {
      is_official: isOfficial,
      confidence_score: parseFloat(confidence.toFixed(2)),
      official_domain_match: isOfficial,
      source_title: isOfficial ? `${universityName} — Official Admissions Page` : "Unverified Source",
      source_excerpt: isOfficial
        ? "Official admissions requirements sourced from the university website."
        : "Source could not be verified as an official university page.",
      source_type: isOfficial ? "official" : "unknown",
      verified_at: now(),
    }
  }

  // TODO: Replace with actual LLM confidence scoring using extracted text
  calculateConfidenceScore(
    source: SourceVerificationResult,
    extractedText: string
  ): number {
    let score = source.confidence_score
    // Boost confidence if text contains requirement-indicating keywords
    const keywords = ["required", "must submit", "official", "deadline", "minimum", "GRE", "TOEFL", "GPA"]
    const hits = keywords.filter(k => extractedText.toLowerCase().includes(k.toLowerCase())).length
    score = Math.min(1.0, score + hits * 0.02)
    return parseFloat(score.toFixed(2))
  }

  // TODO: Replace with WHOIS lookup + DNS verification against university domain
  detectOfficialSource(sourceUrl: string, universityName: string): boolean {
    if (!sourceUrl) return false
    try {
      const url = new URL(sourceUrl)
      const hostname = url.hostname.toLowerCase()
      // Check TLD
      const hasTldMatch = OFFICIAL_TLD_PATTERNS.some(tld => hostname.endsWith(tld))
      // Check university name slug in domain
      const slug = universityName.toLowerCase().replace(/\s+/g, "").replace(/university|college|institute/g, "")
      const hasDomainMatch = hostname.includes(slug.slice(0, 5))
      // Check path for admissions-like segments
      const pathLower = url.pathname.toLowerCase()
      const hasPathMatch = OFFICIAL_PATH_PATTERNS.some(p => pathLower.includes(p))
      return hasTldMatch || (hasDomainMatch && hasPathMatch)
    } catch {
      return false
    }
  }

  flagLowConfidenceItems(
    requirements: (ProgramRequirement | EssayRequirement)[]
  ): string[] {
    return requirements.filter(r => r.confidence_score < 0.5).map(r => r.id)
  }
}
