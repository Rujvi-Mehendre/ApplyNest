import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { castRequirements, castEssays, castRecs } from "@/lib/supabase/db"
import { calculateExtendedWorkload } from "@/lib/ai/mock-ai"
import type { SavedProgram, Program } from "@/lib/supabase/types"

export const dynamic = "force-dynamic"

export default async function WorkloadPlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: spRows } = await supabase
    .from("saved_programs")
    .select("*, program:programs(*)")
    .eq("user_id", user.id)
    .order("deadline", { ascending: true })

  const savedPrograms = (spRows ?? []) as (SavedProgram & { program: Program })[]
  const spIds = savedPrograms.map(sp => sp.id)

  let reqs = castRequirements([])
  let essays = castEssays([])
  let recs = castRecs([])

  if (spIds.length > 0) {
    const [rReqs, rEssays, rRecs] = await Promise.all([
      supabase.from("program_requirements").select("*").in("saved_program_id", spIds),
      supabase.from("essay_requirements").select("*").in("saved_program_id", spIds),
      supabase.from("recommendation_requests").select("*").in("saved_program_id", spIds),
    ])
    reqs = castRequirements(rReqs.data)
    essays = castEssays(rEssays.data)
    recs = castRecs(rRecs.data)
  }

  // TODO: Replace calculateExtendedWorkload with real scheduling using actual deadline data
  const workload = calculateExtendedWorkload(savedPrograms, essays, reqs, recs)

  const stats = [
    { label: "Programs", value: workload.total_programs ?? savedPrograms.length, icon: "🎓" },
    { label: "Essays", value: workload.total_essays, icon: "✍️" },
    { label: "Requirements", value: workload.total_requirements, icon: "📋" },
    { label: "Prompt Groups", value: workload.unique_prompt_groups ?? "—", icon: "📝" },
    { label: "Recs Needed", value: workload.total_recommendations_needed ?? recs.length, icon: "👤" },
    { label: "Due in 14 Days", value: workload.deadlines_14d ?? "—", icon: "⏰" },
    { label: "Est. Writing Hours", value: workload.estimated_writing_hours ?? workload.estimated_hours, icon: "🕐" },
    { label: "App Fees Total", value: workload.app_fees_total ?? "—", icon: "💰" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-rust">Workload Planner</h1>
        <p className="text-sienna/70 text-sm mt-1">
          Your application effort at a glance — deadlines, effort, and what needs attention.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        ⚡ Mock AI — estimates are approximate. Verify all deadlines and requirements from official program websites before submitting.
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-sand/60 rounded-2xl p-4 text-center shadow-warm">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-extrabold text-rust">{s.value}</div>
            <div className="text-xs text-sienna/60 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Attention flags */}
      {((workload.programs_missing_sources ?? 0) > 0 || (workload.low_confidence_items ?? 0) > 0) && (
        <div className="bg-card border border-sand/60 rounded-2xl p-5">
          <h2 className="font-bold text-rust mb-3">⚠️ Attention Needed</h2>
          <div className="space-y-2">
            {(workload.programs_missing_sources ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-sienna">Requirements or essays missing sources</span>
                <span className="font-bold text-rust">{workload.programs_missing_sources}</span>
              </div>
            )}
            {(workload.low_confidence_items ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-sienna">Low-confidence items</span>
                <span className="font-bold text-amber-700">{workload.low_confidence_items}</span>
              </div>
            )}
          </div>
          <a href="/review" className="text-xs text-copper font-semibold hover:text-sienna mt-3 inline-block">
            → Go to Review Queue
          </a>
        </div>
      )}

      {/* High effort + Quick wins */}
      {savedPrograms.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {(workload.high_effort_programs?.length ?? 0) > 0 && (
            <div className="bg-card border border-red-200 rounded-2xl p-5">
              <h2 className="font-bold text-red-700 mb-3">🔴 High Effort Programs</h2>
              <p className="text-xs text-sienna/60 mb-3">4+ unfinished essays. Start these first.</p>
              <ul className="space-y-1">
                {workload.high_effort_programs!.map(p => (
                  <li key={p} className="text-sm font-semibold text-rust">· {p}</li>
                ))}
              </ul>
            </div>
          )}
          {(workload.quick_win_programs?.length ?? 0) > 0 && (
            <div className="bg-card border border-green-200 rounded-2xl p-5">
              <h2 className="font-bold text-green-700 mb-3">✅ Quick Wins</h2>
              <p className="text-xs text-sienna/60 mb-3">≤2 essays due within 14 days. Finish these now.</p>
              <ul className="space-y-1">
                {workload.quick_win_programs!.map(p => (
                  <li key={p} className="text-sm font-semibold text-rust">· {p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {savedPrograms.length === 0 && (
        <div className="text-center py-16 bg-card border border-sand/60 rounded-2xl">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-lg font-bold text-rust mb-1">No programs yet</h2>
          <p className="text-sienna/60 text-sm">Add programs to see your workload estimate and plan.</p>
          <a href="/programs" className="text-xs text-copper font-semibold hover:text-sienna mt-3 inline-block">
            → Go to Programs
          </a>
        </div>
      )}
    </div>
  )
}
