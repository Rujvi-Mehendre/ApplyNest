// Provider registry — swap mock for real implementations here.
//
// To enable a real provider:
// 1. Create a new class implementing the interface in lib/providers/real/
// 2. Import it below and replace the mock import
// 3. Set any required env vars (API keys, endpoints)
//
// Example:
//   import { ClaudeFitScoringProvider } from "./real/fit-scoring"
//   fitScoring: new ClaudeFitScoringProvider(process.env.ANTHROPIC_API_KEY!)

import { MockProgramDiscoveryProvider } from "./mock/program-discovery"
import { MockRequirementExtractionProvider } from "./mock/requirement-extraction"
import { MockEssayExtractionProvider } from "./mock/essay-extraction"
import { MockSourceVerificationProvider } from "./mock/source-verification"
import { MockFitScoringProvider } from "./mock/fit-scoring"
import { MockEssaySimilarityProvider } from "./mock/essay-similarity"

export type { ProgramDiscoveryProvider, RequirementExtractionProvider, EssayExtractionProvider, SourceVerificationProvider, FitScoringProvider, EssaySimilarityProvider } from "./interfaces"
export type { ProgramSearchFilters, DiscoveredProgram, ExtractedRequirement, ExtractedEssay, SourceVerificationResult, FitScoreResult, PromptGroup, ExtendedWorkloadSummary } from "./types"

export function getProviders() {
  return {
    // TODO: Replace MockProgramDiscoveryProvider with a real implementation
    programDiscovery: new MockProgramDiscoveryProvider(),
    // TODO: Replace MockRequirementExtractionProvider with a real web scraper + LLM
    requirementExtraction: new MockRequirementExtractionProvider(),
    // TODO: Replace MockEssayExtractionProvider with a real web scraper + LLM
    essayExtraction: new MockEssayExtractionProvider(),
    // TODO: Replace MockSourceVerificationProvider with a real domain verification service
    sourceVerification: new MockSourceVerificationProvider(),
    // TODO: Replace MockFitScoringProvider with Claude API (claude-sonnet-4-6 or higher)
    fitScoring: new MockFitScoringProvider(),
    // TODO: Replace MockEssaySimilarityProvider with semantic embeddings (Anthropic or HuggingFace)
    essaySimilarity: new MockEssaySimilarityProvider(),
  }
}
