// TODO: Replace with a real ProgramDiscoveryProvider backed by
// an LLM + program database when ready (see lib/providers/index.ts).

import type { ProgramDiscoveryProvider } from "../interfaces"
import type { ProgramSearchFilters, DiscoveredProgram } from "../types"
import type { ApplicantProfile, Program } from "@/lib/supabase/types"

const SEED_RESULTS: DiscoveredProgram[] = [
  { name: "EECS PhD", university: "MIT", degree_type: "PhD", location: "Cambridge, MA", website: "https://www.eecs.mit.edu/", match_score: 88, match_reason: "Strong research alignment with AI/ML faculty. Highly competitive — requires excellent GRE + publications." },
  { name: "Computer Science MS", university: "Stanford University", degree_type: "MS", location: "Stanford, CA", website: "https://cs.stanford.edu/", match_score: 82, match_reason: "Top-ranked program in AI. Industry connections ideal for ML/data science career goals." },
  { name: "Master of Computational Data Science (MCDS)", university: "Carnegie Mellon University", degree_type: "MS", location: "Pittsburgh, PA", website: "https://mcds.cs.cmu.edu/", match_score: 79, match_reason: "Designed specifically for data science with strong industry placement. Competitive but attainable with strong GPA." },
  { name: "Master of Information & Data Science (MIDS)", university: "UC Berkeley", degree_type: "MS", location: "Berkeley, CA", website: "https://ischool.berkeley.edu/programs/mids", match_score: 75, match_reason: "Interdisciplinary program covering ML, statistics, and policy. Good fit for applicants with mixed background." },
  { name: "MS Computer Science (OMS)", university: "Georgia Tech", degree_type: "MS", location: "Online", website: "https://omscs.gatech.edu/", match_score: 71, match_reason: "Highly accessible online MS. Specialization in Machine Learning available. Excellent value." },
  { name: "MS Applied Data Science", university: "University of Michigan", degree_type: "MS", location: "Ann Arbor, MI", website: "https://www.si.umich.edu/programs/master-applied-data-science", match_score: 68, match_reason: "Applied focus with strong UX and ethics components. Good for breadth-oriented applicants." },
  { name: "MS Align Computer Science", university: "Northeastern University", degree_type: "MS", location: "Boston, MA", website: "https://www.khoury.northeastern.edu/programs/align-masters-of-science-in-computer-science/", match_score: 65, match_reason: "Bridge program for career changers. Strong co-op network in Boston tech scene." },
  { name: "MS Data Science", university: "Boston University", degree_type: "MS", location: "Boston, MA", website: "https://www.bu.edu/cds-faculty/programs-admissions/ms-in-data-science/", match_score: 62, match_reason: "Growing CDS faculty with focus on health informatics and finance data science." },
]

export class MockProgramDiscoveryProvider implements ProgramDiscoveryProvider {
  // TODO: Implement with real program database API + LLM ranking
  async searchPrograms(
    filters: ProgramSearchFilters,
    _applicantProfile: Partial<ApplicantProfile>
  ): Promise<DiscoveredProgram[]> {
    let results = [...SEED_RESULTS]
    if (filters.degree_type) {
      results = results.filter(p => p.degree_type.toLowerCase() === filters.degree_type!.toLowerCase())
    }
    if (filters.location) {
      const loc = filters.location.toLowerCase()
      results = results.filter(p => p.location?.toLowerCase().includes(loc))
    }
    // Simulate slight randomness in match score as a real provider would
    results = results.map(p => ({
      ...p,
      match_score: Math.min(100, p.match_score + Math.floor(Math.random() * 5) - 2),
    }))
    return results.sort((a, b) => b.match_score - a.match_score)
  }

  // TODO: Implement with web scraping + LLM data extraction
  async getProgramDetails(programUrl: string): Promise<Partial<Program>> {
    const university = SEED_RESULTS.find(p => p.website === programUrl)?.university ?? "Unknown University"
    return {
      university,
      description: `This is a mock description for ${university}. In production, this would be extracted from the program's official website using web scraping and LLM parsing.`,
    }
  }

  // TODO: Implement with LLM-based fit scoring incorporating profile details
  async rankPrograms(
    programs: DiscoveredProgram[],
    _applicantProfile: Partial<ApplicantProfile>
  ): Promise<DiscoveredProgram[]> {
    return [...programs].sort((a, b) => b.match_score - a.match_score)
  }
}
