// TODO: Replace with a real FitScoringProvider backed by
// a structured LLM prompt with profile + program + requirements data (see lib/providers/index.ts).

import type { FitScoringProvider } from "../interfaces"
import type { FitScoreResult } from "../types"
import type { ApplicantProfile, Program, ProgramRequirement } from "@/lib/supabase/types"

const UNIVERSITY_TIERS: Record<string, number> = {
  MIT: 0.90, Stanford: 0.88, "Carnegie Mellon": 0.82, Harvard: 0.90, Caltech: 0.88,
  Berkeley: 0.80, "UC Berkeley": 0.80, Princeton: 0.88, Yale: 0.85,
  Georgia: 0.65, Michigan: 0.68, Northeastern: 0.55, Boston: 0.55,
}

function getDifficulty(university: string): number {
  for (const [name, tier] of Object.entries(UNIVERSITY_TIERS)) {
    if (university.includes(name)) return tier
  }
  return 0.60
}

export class MockFitScoringProvider implements FitScoringProvider {
  // TODO: Replace with Claude API call using a structured scoring prompt
  async scoreProgramFit(
    profile: Partial<ApplicantProfile>,
    program: Program,
    _requirements?: ProgramRequirement[]
  ): Promise<FitScoreResult> {
    const profileGpa = profile.gpa ?? profile.undergrad_gpa ?? 3.5
    const workYears = profile.work_experience_years ?? 0
    const hasResearch = !!profile.research_experience && profile.research_experience.length > 10
    const difficulty = getDifficulty(program.university)

    const gpaFit = Math.min(100, Math.round((profileGpa / 4.0) * 100 * (1 - difficulty * 0.25) + Math.random() * 5))
    const testFit = Math.round(60 + Math.random() * 30)
    const researchFit = hasResearch ? Math.round(70 + Math.random() * 25) : Math.round(30 + Math.random() * 30)
    const expFit = Math.min(100, Math.round(50 + workYears * 8 + Math.random() * 15))
    const overall = Math.round(gpaFit * 0.3 + testFit * 0.2 + researchFit * 0.3 + expFit * 0.2)

    const profileGaps = this.identifyProfileGaps(profile, program)
    const suggestedActions = this.suggestProfileActions(profile, program)

    const reasoning = [
      profileGpa >= 3.8 ? "Strong GPA aligns well with program expectations." : "GPA is within range but competitive applicants often score higher.",
      hasResearch ? "Research background is a significant strength for this program." : "Adding research experience would strengthen this application.",
      workYears >= 2 ? `${workYears} years of work experience is well-regarded.` : "Additional industry experience could improve your profile.",
      `${program.university} ${program.name} typically considers applicants with your academic background.`,
    ].join(" ")

    return { overall_score: overall, gpa_fit: gpaFit, test_score_fit: testFit, research_fit: researchFit, experience_fit: expFit, reasoning, profile_gaps: profileGaps, suggested_actions: suggestedActions }
  }

  explainFitScore(score: FitScoreResult): string {
    if (score.overall_score >= 80) return "Strong overall fit. Focus on polishing your essays and securing strong LORs."
    if (score.overall_score >= 65) return "Moderate fit. Address profile gaps and target professors whose research aligns with yours."
    return "Competitive reach. Strengthen weak areas and apply strategically to programs where your profile stands out."
  }

  // TODO: Replace with LLM-based gap analysis comparing profile to known program requirements
  identifyProfileGaps(profile: Partial<ApplicantProfile>, program: Program): string[] {
    const gaps: string[] = []
    const difficulty = getDifficulty(program.university)
    const gpa = profile.gpa ?? profile.undergrad_gpa ?? 0
    if (gpa < 3.5 && difficulty > 0.75) gaps.push("GPA below typical range for this tier program")
    if (!profile.research_experience) gaps.push("No research experience listed")
    if (!profile.gre_quant && !profile.gmat_score) gaps.push("No GRE/GMAT scores on file")
    if ((profile.work_experience_years ?? 0) < 1 && program.degree_type === "MBA") gaps.push("MBA programs typically prefer 2+ years of work experience")
    if (!profile.skills?.length) gaps.push("No technical skills listed in profile")
    return gaps
  }

  // TODO: Replace with LLM-generated personalized action suggestions
  suggestProfileActions(profile: Partial<ApplicantProfile>, program: Program): string[] {
    const actions: string[] = []
    const difficulty = getDifficulty(program.university)
    if (!profile.research_experience && difficulty > 0.75) {
      actions.push("Contact a professor about a research assistant position before applying")
    }
    if (!profile.gre_quant) {
      actions.push("Register for GRE — most competitive programs require it")
    }
    const gpa = profile.gpa ?? profile.undergrad_gpa ?? 0
    if (gpa > 0 && gpa < 3.7 && difficulty > 0.8) {
      actions.push("Consider taking 1-2 graduate-level courses to demonstrate academic readiness")
    }
    if (!profile.skills?.length) {
      actions.push("List technical skills (Python, ML frameworks, etc.) in your profile")
    }
    if (actions.length === 0) actions.push("Profile looks solid — focus on crafting program-specific essays")
    return actions
  }
}
