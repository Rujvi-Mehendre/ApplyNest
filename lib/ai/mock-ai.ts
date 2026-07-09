import type { ApplicantProfile, EssayRequirement, SavedProgram, Program } from "@/lib/supabase/types"

// TODO: Replace these mock functions with real AI implementations
// using an LLM provider (e.g. Anthropic Claude) when ready.

export interface ParsedProfile {
  full_name?: string
  email?: string
  phone?: string
  undergrad_institution?: string
  undergrad_major?: string
  undergrad_gpa?: number
  gpa?: number
  work_experience_years?: number
  research_experience?: string
  skills?: string[]
}

export interface ProgramFitResult {
  overall_score: number
  gpa_fit: number
  test_score_fit: number
  research_fit: number
  experience_fit: number
  reasoning: string
}

export interface EssayGroup {
  theme: string
  essay_ids: string[]
  similarity_score: number
  suggested_base: string
}

export interface WorkloadSummary {
  total_essays: number
  total_requirements: number
  essays_not_started: number
  reqs_not_started: number
  estimated_hours: number
  busiest_week: string
  risk_level: "low" | "medium" | "high"
  // Extended fields (populated by calculateExtendedWorkload)
  total_programs?: number
  unique_prompt_groups?: number
  total_recommendations_needed?: number
  deadlines_7d?: number
  deadlines_14d?: number
  deadlines_30d?: number
  estimated_writing_hours?: number
  programs_missing_sources?: number
  low_confidence_items?: number
  app_fees_total?: string
  high_effort_programs?: string[]
  quick_win_programs?: string[]
}

export interface WeeklyPlan {
  week_start: string
  week_end: string
  tasks: { title: string; program: string; type: "essay" | "requirement" | "admin"; hours: number }[]
  total_hours: number
}

// TODO: Implement real resume parsing using Anthropic Claude with structured output
export function parseResumeToProfile(resumeText: string): ParsedProfile {
  const lines = resumeText.split("\n").filter(Boolean)
  const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/)
  const phoneMatch = resumeText.match(/[\d()\s\-+]{10,15}/)
  const gpaMatch = resumeText.match(/GPA[:\s]+(\d\.\d+)/i)

  const skillKeywords = ["Python", "R", "SQL", "TensorFlow", "PyTorch", "Scala", "Java", "C++", "MATLAB", "Machine Learning", "Deep Learning", "Statistics", "Data Analysis"]
  const foundSkills = skillKeywords.filter(s => resumeText.includes(s))

  return {
    full_name: lines[0]?.trim() || "Parsed Name",
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0]?.trim() || "",
    undergrad_gpa: gpaMatch ? parseFloat(gpaMatch[1]) : 3.7,
    gpa: gpaMatch ? parseFloat(gpaMatch[1]) : 3.7,
    work_experience_years: 2,
    skills: foundSkills.length > 0 ? foundSkills : ["Python", "SQL", "Machine Learning"],
    research_experience: resumeText.toLowerCase().includes("research") ? "Prior research experience detected from resume" : "",
  }
}

// TODO: Replace with MockFitScoringProvider.scoreProgramFit() — see lib/providers/index.ts
// When swapping in a real provider: change getProviders().fitScoring and update callers to await.
export function scoreProgramFit(
  profile: Partial<ApplicantProfile>,
  program: Program & { category?: string }
): ProgramFitResult {
  const profileGpa = profile.gpa ?? profile.undergrad_gpa ?? 3.5
  const workYears = profile.work_experience_years ?? 0
  const hasResearch = !!profile.research_experience && profile.research_experience.length > 10

  const programDifficulty =
    program.university.includes("MIT") || program.university.includes("Stanford") ? 0.85
    : program.university.includes("Carnegie") || program.university.includes("Berkeley") ? 0.75
    : program.university.includes("Michigan") || program.university.includes("Georgia") ? 0.65
    : 0.55

  const gpaFit = Math.min(100, Math.round((profileGpa / 4.0) * 100 * (1 - programDifficulty * 0.3) + Math.random() * 5))
  const testFit = Math.round(60 + Math.random() * 30)
  const researchFit = hasResearch ? Math.round(70 + Math.random() * 25) : Math.round(30 + Math.random() * 30)
  const expFit = Math.min(100, Math.round(50 + workYears * 8 + Math.random() * 15))
  const overall = Math.round((gpaFit * 0.3 + testFit * 0.2 + researchFit * 0.3 + expFit * 0.2))

  const reasons = [
    profileGpa >= 3.8 ? "Strong GPA aligns well with program expectations." : "GPA is within range but competitive applicants often score higher.",
    hasResearch ? "Research background is a significant strength for this program." : "Adding research experience would strengthen this application.",
    workYears >= 2 ? `${workYears} years of work experience is well-regarded.` : "Additional industry experience could improve fit.",
    `${program.university} ${program.name} typically admits students with your academic profile.`,
  ]

  return {
    overall_score: overall,
    gpa_fit: gpaFit,
    test_score_fit: testFit,
    research_fit: researchFit,
    experience_fit: expFit,
    reasoning: reasons.join(" "),
  }
}

// TODO: Replace with MockEssaySimilarityProvider.createPromptGroups() — see lib/providers/index.ts
// The provider returns PromptGroup[] (richer type); this wrapper keeps backward compat for existing callers.
export function detectSimilarEssayPrompts(essays: EssayRequirement[]): EssayGroup[] {
  const sopEssays = essays.filter(e => e.essay_type === "sop")
  const whySchoolEssays = essays.filter(e => e.essay_type === "why_school")
  const diversityEssays = essays.filter(e => e.essay_type === "diversity")

  const groups: EssayGroup[] = []

  if (sopEssays.length >= 2) {
    groups.push({
      theme: "Statement of Purpose / Research Goals",
      essay_ids: sopEssays.map(e => e.id),
      similarity_score: 0.82,
      suggested_base: "Develop a core SOP narrative that can be customized per school (research fit, faculty, lab mentions).",
    })
  }

  if (whySchoolEssays.length >= 2) {
    groups.push({
      theme: "Why This School / Program Fit",
      essay_ids: whySchoolEssays.map(e => e.id),
      similarity_score: 0.71,
      suggested_base: "Create a template with [SCHOOL], [FACULTY], and [PROGRAM FEATURE] placeholders for efficient customization.",
    })
  }

  if (diversityEssays.length >= 1) {
    groups.push({
      theme: "Diversity & Inclusion",
      essay_ids: diversityEssays.map(e => e.id),
      similarity_score: 0.65,
      suggested_base: "Draft a diversity statement highlighting unique background and perspective.",
    })
  }

  return groups
}

// TODO: Implement real workload calculation using deadline-aware scheduling and LLM-estimated effort
export function calculateApplicationWorkload(savedPrograms: SavedProgram[]): WorkloadSummary {
  const total_essays = savedPrograms.length * 2.5
  const total_requirements = savedPrograms.length * 4
  const essays_not_started = Math.round(total_essays * 0.6)
  const reqs_not_started = Math.round(total_requirements * 0.5)
  const estimated_hours = Math.round(total_essays * 6 + reqs_not_started * 1.5)

  return {
    total_essays: Math.round(total_essays),
    total_requirements: Math.round(total_requirements),
    essays_not_started,
    reqs_not_started,
    estimated_hours,
    busiest_week: "Dec 1–7",
    risk_level: savedPrograms.length > 6 ? "high" : savedPrograms.length > 3 ? "medium" : "low",
  }
}

// TODO: Replace workload calculation with deadline-aware scheduling using real requirement/essay data
export function calculateExtendedWorkload(
  savedPrograms: (SavedProgram & { program?: Program })[],
  essays: EssayRequirement[],
  requirements: import("@/lib/supabase/types").ProgramRequirement[],
  recs: import("@/lib/supabase/types").RecommendationRequest[]
): WorkloadSummary {
  const now = Date.now()
  const d7 = now + 7 * 864e5
  const d14 = now + 14 * 864e5
  const d30 = now + 30 * 864e5

  const inWindow = (deadline: string | null, cutoff: number) => {
    if (!deadline) return false
    const t = new Date(deadline).getTime()
    return t >= now && t <= cutoff
  }

  const essaysNotStarted = essays.filter(e => e.status === "not_started").length
  const reqsNotStarted = requirements.filter(r => r.status === "not_started" || r.status === "needed").length
  const writingHours = essaysNotStarted * 6 + (essays.filter(e => e.status === "draft_1" || e.status === "outline").length * 3)

  // high-effort = > 3 unfinished essays; quick-win = ≤ 2 essays + deadline within 14 days
  const highEffort = savedPrograms
    .filter(sp => essays.filter(e => e.saved_program_id === sp.id && !["final","submitted"].includes(e.status)).length > 3)
    .map(sp => sp.program?.university ?? sp.id)
  const quickWin = savedPrograms
    .filter(sp => {
      const spEssays = essays.filter(e => e.saved_program_id === sp.id && !["final","submitted"].includes(e.status))
      return spEssays.length <= 2 && inWindow(sp.deadline, d14)
    })
    .map(sp => sp.program?.university ?? sp.id)

  // app fees: parse "$75" style values and sum them
  const feeTotal = savedPrograms.reduce((sum, sp) => {
    const match = (sp.app_fee ?? "").match(/\$?([\d,.]+)/)
    return sum + (match ? parseFloat(match[1].replace(/,/g, "")) : 0)
  }, 0)

  // prompt groups via simple type grouping (avoids importing providers in mock-ai)
  const typesSeen = new Set(essays.map(e => e.essay_type))

  const missingSources = requirements.filter(r => !r.source_url && r.source_type !== "user_entered" && r.source_type !== "portal_entered").length
    + essays.filter(e => !e.source_url && e.source_type !== "user_entered" && e.source_type !== "portal_entered").length

  const lowConf = requirements.filter(r => r.confidence_score < 0.5).length
    + essays.filter(e => e.confidence_score < 0.5).length

  const base = calculateApplicationWorkload(savedPrograms)
  return {
    ...base,
    total_programs: savedPrograms.length,
    unique_prompt_groups: typesSeen.size,
    total_recommendations_needed: recs.filter(r => r.status !== "submitted" && r.status !== "waived").length,
    deadlines_7d: savedPrograms.filter(sp => inWindow(sp.deadline, d7)).length,
    deadlines_14d: savedPrograms.filter(sp => inWindow(sp.deadline, d14)).length,
    deadlines_30d: savedPrograms.filter(sp => inWindow(sp.deadline, d30)).length,
    estimated_writing_hours: Math.round(writingHours),
    programs_missing_sources: missingSources,
    low_confidence_items: lowConf,
    app_fees_total: feeTotal > 0 ? `$${feeTotal.toLocaleString()}` : "—",
    high_effort_programs: highEffort,
    quick_win_programs: quickWin,
  }
}

// TODO: Replace with LLM-generated personalized weekly study plan
export function generateWeeklyApplicationPlan(savedPrograms: SavedProgram[]): WeeklyPlan[] {
  const now = new Date()
  const plans: WeeklyPlan[] = []

  const sorted = [...savedPrograms].sort((a, b) => {
    const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
    const db = b.deadline ? new Date(b.deadline).getTime() : Infinity
    return da - db
  })

  const weeklyTaskTemplates = [
    // Week 1: Gather materials
    [
      { title: "Request official transcripts", type: "requirement" as const, hours: 1.5 },
      { title: "Order GRE/TOEFL score reports", type: "requirement" as const, hours: 1 },
      { title: "Compile resume — target 1-page", type: "requirement" as const, hours: 3 },
      { title: "Outline Statement of Purpose", type: "essay" as const, hours: 2.5 },
    ],
    // Week 2: Essay drafts
    [
      { title: "Draft SOP — background & goals section", type: "essay" as const, hours: 4 },
      { title: "Draft 'Why This School' essays", type: "essay" as const, hours: 3 },
      { title: "Ask recommenders (send brag sheet)", type: "admin" as const, hours: 1.5 },
    ],
    // Week 3: Revision
    [
      { title: "Revise SOP — research fit & faculty mentions", type: "essay" as const, hours: 3 },
      { title: "Draft diversity / personal statement", type: "essay" as const, hours: 2.5 },
      { title: "Verify all requirements from official pages", type: "requirement" as const, hours: 1.5 },
      { title: "Follow up with recommenders", type: "admin" as const, hours: 0.5 },
    ],
    // Week 4: Final polish
    [
      { title: "Final proofread of all essays", type: "essay" as const, hours: 2 },
      { title: "Complete application portal forms", type: "admin" as const, hours: 3 },
      { title: "Submit nearest deadline(s)", type: "admin" as const, hours: 1.5 },
      { title: "Confirm recommender submissions", type: "requirement" as const, hours: 0.5 },
    ],
  ]

  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const templateTasks = weeklyTaskTemplates[i]
    const tasks = templateTasks.map((t, j) => ({
      title: t.title,
      program: sorted[j % Math.max(sorted.length, 1)]?.program?.university ?? "All Programs",
      type: t.type,
      hours: t.hours,
    }))

    plans.push({
      week_start: weekStart.toISOString().split("T")[0],
      week_end: weekEnd.toISOString().split("T")[0],
      tasks,
      total_hours: parseFloat(tasks.reduce((sum, t) => sum + t.hours, 0).toFixed(1)),
    })
  }

  return plans
}
