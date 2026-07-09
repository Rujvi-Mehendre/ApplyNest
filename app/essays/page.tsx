import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/PageHeader"
import { EssayStatusChip, SourceBadge, ConfidenceBadge, CategoryBadge } from "@/components/shared/StatusChip"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatCard } from "@/components/dashboard/StatCard"
import { detectSimilarEssayPrompts } from "@/lib/ai/mock-ai"
import { formatDate, deadlineUrgency } from "@/lib/utils"
import { castEssays, castSavedPrograms } from "@/lib/supabase/db"
import { ExportMenu } from "@/components/shared/ExportMenu"
import { PenLine, CheckCircle, Clock, AlertCircle, Lightbulb } from "lucide-react"
import type { EssayRequirement, SavedProgram, Program } from "@/lib/supabase/types"

export default async function EssaysDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get user's saved programs first
  const { data: spData } = await supabase
    .from("saved_programs")
    .select("*, program:programs(*)")
    .eq("user_id", user.id)

  const savedPrograms = castSavedPrograms(spData) as (SavedProgram & { program: Program })[]
  const programIds = savedPrograms.map(p => p.id)

  let all: EssayRequirement[] = []
  if (programIds.length > 0) {
    const { data } = await supabase
      .from("essay_requirements")
      .select("*")
      .in("saved_program_id", programIds)
      .order("deadline")
    all = castEssays(data) as EssayRequirement[]
  }

  // Build a lookup for saved_program by id
  const spById = Object.fromEntries(savedPrograms.map(sp => [sp.id, sp]))

  const total = all.length
  const notStarted = all.filter(e => e.status === "not_started").length
  const inProgress = all.filter(e => ["outline","draft_1","revised"].includes(e.status)).length
  const finalized = all.filter(e => ["final","submitted"].includes(e.status)).length
  const missingPrompts = all.filter(e => !e.prompt_text).length
  const portalOnly = all.filter(e => e.portal_only).length
  const lowConf = all.filter(e => e.confidence_score < 0.5).length

  const groups = detectSimilarEssayPrompts(all)

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Essay Dashboard"
        description="Track every prompt, draft, and essay across all programs."
        icon="✍️"
        actions={all.length > 0 ? <ExportMenu essays={all} programs={savedPrograms} variant="essays" /> : undefined}
      />

      {all.length === 0 ? (
        <div className="bg-card rounded-3xl border border-sand/60 shadow-warm">
          <EmptyState icon="📝" title="No essays yet" description="Add programs and their essay prompts to start tracking." />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Essays" value={total} icon={PenLine} accent="rust" />
            <StatCard label="Not Started" value={notStarted} sub="Need attention" icon={AlertCircle} accent="copper" />
            <StatCard label="In Progress" value={inProgress} sub="Keep writing!" icon={Clock} accent="sand" />
            <StatCard label="Finalized" value={finalized} sub="Almost there 🌸" icon={CheckCircle} accent="olive" />
          </div>

          {(missingPrompts > 0 || portalOnly > 0 || lowConf > 0) && (
            <div className="grid md:grid-cols-3 gap-3">
              {missingPrompts > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <p className="font-bold text-amber-800 text-sm">{missingPrompts} missing prompt{missingPrompts !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-amber-700">Add the exact prompt text</p>
                  </div>
                </div>
              )}
              {portalOnly > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="font-bold text-purple-800 text-sm">{portalOnly} portal-only prompt{portalOnly !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-purple-700">Only visible after starting application</p>
                  </div>
                </div>
              )}
              {lowConf > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl">🔴</span>
                  <div>
                    <p className="font-bold text-red-800 text-sm">{lowConf} low-confidence prompt{lowConf !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-red-700">Please verify from official sources</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {groups.length > 0 && (
            <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
              <h2 className="font-bold text-rust mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-copper" /> Reusable Essay Groups (Mock AI)
              </h2>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-4 inline-block">
                ⚡ Detected by mock AI — real semantic grouping coming soon
              </p>
              <div className="space-y-3">
                {groups.map((g, i) => (
                  <div key={i} className="p-4 rounded-xl bg-cream border border-sand/40">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-rust text-sm">{g.theme}</h3>
                      <span className="text-xs bg-copper/10 text-copper px-2 py-0.5 rounded-full font-semibold">{g.essay_ids.length} essays</span>
                    </div>
                    <p className="text-xs text-sienna/80 leading-relaxed">{g.suggested_base}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-sand/60 shadow-warm overflow-hidden">
            <div className="px-5 py-3 border-b border-sand/40 bg-cream/40">
              <h2 className="font-bold text-rust text-sm">{total} Essay{total !== 1 ? "s" : ""} Across All Programs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand/40 bg-cream/20">
                    {["Program","Type","Status","Word Limit","Deadline","Source"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-bold text-sienna/60 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {all.map((essay, i) => {
                    const sp = spById[essay.saved_program_id]
                    const urgency = deadlineUrgency(essay.deadline)
                    return (
                      <tr key={essay.id} className={`border-b border-sand/20 hover:bg-cream/40 transition-colors ${i % 2 === 1 ? "bg-cream/20" : ""}`}>
                        <td className="py-3 px-4">
                          <p className="font-bold text-rust text-xs">{sp?.program?.university}</p>
                          <CategoryBadge category={(sp?.category ?? "Target") as "Reach" | "Target" | "Safer"} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs bg-sand/30 text-sienna px-2 py-0.5 rounded-full font-semibold capitalize">
                            {essay.essay_type.replace(/_/g," ")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <EssayStatusChip status={essay.status as Parameters<typeof EssayStatusChip>[0]["status"]} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-sienna font-medium">
                            {essay.word_limit ? `${essay.word_limit}w` : essay.character_limit ? `${essay.character_limit}c` : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium ${urgency === "urgent" ? "text-red-600" : urgency === "soon" ? "text-amber-600" : "text-sienna"}`}>
                            {formatDate(essay.deadline)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <SourceBadge type={essay.source_type as Parameters<typeof SourceBadge>[0]["type"]} />
                            <ConfidenceBadge score={essay.confidence_score} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
