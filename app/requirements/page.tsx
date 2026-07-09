import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/PageHeader"
import { ReqStatusChip, SourceBadge, ConfidenceBadge, CategoryBadge } from "@/components/shared/StatusChip"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatCard } from "@/components/dashboard/StatCard"
import { formatDate, deadlineUrgency } from "@/lib/utils"
import { castRequirements, castSavedPrograms } from "@/lib/supabase/db"
import { ExportMenu } from "@/components/shared/ExportMenu"
import { ClipboardList, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import type { ProgramRequirement, SavedProgram, Program } from "@/lib/supabase/types"

export default async function RequirementsDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: spData } = await supabase
    .from("saved_programs")
    .select("*, program:programs(*)")
    .eq("user_id", user.id)

  const savedPrograms = castSavedPrograms(spData) as (SavedProgram & { program: Program })[]
  const programIds = savedPrograms.map(p => p.id)
  const spById = Object.fromEntries(savedPrograms.map(sp => [sp.id, sp]))

  let all: ProgramRequirement[] = []
  if (programIds.length > 0) {
    const { data } = await supabase
      .from("program_requirements")
      .select("*")
      .in("saved_program_id", programIds)
      .order("deadline")
    all = castRequirements(data) as ProgramRequirement[]
  }

  const done = all.filter(r => ["submitted","waived","not_applicable"].includes(r.status)).length
  const pending = all.filter(r => !["submitted","waived","not_applicable"].includes(r.status)).length
  const lowConf = all.filter(r => r.confidence_score < 0.5).length
  const portalOnly = all.filter(r => r.portal_only).length

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Requirements Dashboard"
        description="Track every document, score, and item across all programs."
        icon="📋"
        actions={all.length > 0 ? <ExportMenu requirements={all} programs={savedPrograms} variant="requirements" /> : undefined}
      />

      {all.length === 0 ? (
        <div className="bg-card rounded-3xl border border-sand/60 shadow-warm">
          <EmptyState icon="📋" title="No requirements yet" description="Add programs and their requirements to start tracking." />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total" value={all.length} icon={ClipboardList} accent="rust" />
            <StatCard label="Pending" value={pending} sub="Need action" icon={Clock} accent="copper" />
            <StatCard label="Completed" value={done} sub="Keep it up 🌸" icon={CheckCircle} accent="olive" />
            <StatCard label="Low Confidence" value={lowConf} sub="Verify these" icon={AlertTriangle} accent="sand" />
          </div>

          {(lowConf > 0 || portalOnly > 0) && (
            <div className="grid md:grid-cols-2 gap-3">
              {lowConf > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl">🔴</span>
                  <div>
                    <p className="font-bold text-red-800 text-sm">{lowConf} low-confidence requirement{lowConf !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-red-700">Verify from official program pages</p>
                  </div>
                </div>
              )}
              {portalOnly > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="font-bold text-purple-800 text-sm">{portalOnly} portal-only item{portalOnly !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-purple-700">Only visible after starting the application</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-card rounded-2xl border border-sand/60 shadow-warm overflow-hidden">
            <div className="px-5 py-3 border-b border-sand/40 bg-cream/40">
              <h2 className="font-bold text-rust text-sm">{all.length} Requirement{all.length !== 1 ? "s" : ""} Across All Programs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand/40 bg-cream/20">
                    {["Requirement","Program","Type","Status","Deadline","Source"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-bold text-sienna/60 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {all.map((req, i) => {
                    const sp = spById[req.saved_program_id]
                    const urgency = deadlineUrgency(req.deadline)
                    return (
                      <tr key={req.id} className={`border-b border-sand/20 hover:bg-cream/40 transition-colors ${i % 2 === 1 ? "bg-cream/20" : ""}`}>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-rust text-xs">{req.title}</p>
                          {req.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.description}</p>}
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {req.portal_only && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-semibold">Portal Only</span>}
                            {req.user_verified && <span className="text-xs bg-olive/10 text-olive border border-olive/20 px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</span>}
                            <ConfidenceBadge score={req.confidence_score} />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-rust text-xs">{sp?.program?.university}</p>
                          <CategoryBadge category={(sp?.category ?? "Target") as "Reach" | "Target" | "Safer"} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs bg-sand/30 text-sienna px-2 py-0.5 rounded-full font-semibold capitalize">
                            {req.requirement_type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <ReqStatusChip status={req.status as Parameters<typeof ReqStatusChip>[0]["status"]} />
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium ${urgency === "urgent" ? "text-red-600" : urgency === "soon" ? "text-amber-600" : "text-sienna"}`}>
                            {formatDate(req.deadline)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <SourceBadge type={req.source_type as Parameters<typeof SourceBadge>[0]["type"]} />
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
