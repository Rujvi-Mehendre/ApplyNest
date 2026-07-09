import type { SavedProgram, Program, ProgramRequirement, EssayRequirement } from "./supabase/types"

type SP = SavedProgram & { program?: Program }

function toCsv(rows: Record<string, string | number | boolean | null | undefined>[]): string {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n")
}

export function exportProgramsCsv(programs: SP[]): string {
  return toCsv(programs.map(sp => ({
    university: sp.program?.university ?? "",
    program: sp.program?.name ?? "",
    degree_type: sp.program?.degree_type ?? "",
    location: sp.program?.location ?? "",
    category: sp.category,
    status: sp.status,
    deadline: sp.deadline ?? "",
    portal_url: sp.portal_url ?? "",
    notes: sp.notes ?? "",
  })))
}

export function exportRequirementsCsv(reqs: ProgramRequirement[], programs: SP[]): string {
  const spMap = Object.fromEntries(programs.map(sp => [sp.id, sp]))
  return toCsv(reqs.map(r => ({
    university: spMap[r.saved_program_id]?.program?.university ?? "",
    title: r.title,
    type: r.requirement_type,
    status: r.status,
    deadline: r.deadline ?? "",
    source_type: r.source_type,
    source_title: r.source_title ?? "",
    official_domain_match: r.official_domain_match,
    extraction_method: r.extraction_method ?? "",
    extracted_at: r.extracted_at ?? "",
    confidence: r.confidence_score,
    verified: r.user_verified,
    portal_only: r.portal_only,
  })))
}

export function exportEssaysCsv(essays: EssayRequirement[], programs: SP[]): string {
  const spMap = Object.fromEntries(programs.map(sp => [sp.id, sp]))
  return toCsv(essays.map(e => ({
    university: spMap[e.saved_program_id]?.program?.university ?? "",
    essay_type: e.essay_type,
    prompt: e.prompt_text ?? "",
    word_limit: e.word_limit ?? "",
    character_limit: e.character_limit ?? "",
    deadline: e.deadline ?? "",
    status: e.status,
    portal_only: e.portal_only,
    source_type: e.source_type,
    source_title: e.source_title ?? "",
    official_domain_match: e.official_domain_match,
    extraction_method: e.extraction_method ?? "",
    extracted_at: e.extracted_at ?? "",
    verified: e.user_verified,
    confidence: e.confidence_score,
  })))
}

export function exportWeeklyPlanMd(plan: import("./ai/mock-ai").WeeklyPlan[]): string {
  const lines = ["# ApplyNest — Weekly Application Plan", ""]
  for (const week of plan) {
    lines.push(`## Week of ${week.week_start} – ${week.week_end}`)
    lines.push(`**Total hours:** ~${week.total_hours}h`, "")
    for (const t of week.tasks) {
      const icon = t.type === "essay" ? "✍️" : t.type === "requirement" ? "📋" : "📅"
      lines.push(`- ${icon} **${t.title}** — ${t.program} (~${t.hours}h)`)
    }
    lines.push("")
  }
  return lines.join("\n")
}

export function downloadFile(content: string, filename: string, type = "text/csv") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
