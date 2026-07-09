import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/StatCard"
import { CategoryBadge } from "@/components/shared/StatusChip"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate, daysUntil, deadlineUrgency } from "@/lib/utils"
import { calculateApplicationWorkload } from "@/lib/ai/mock-ai"
import { castSavedPrograms, castRequirements, castEssays, castRecs } from "@/lib/supabase/db"
import {
  GraduationCap, PenLine, ClipboardList, Calendar, AlertTriangle,
  Plus, ArrowRight, TrendingUp, Users, CheckCircle2, Clock
} from "lucide-react"
import type { SavedProgram, Program, RecommendationRequest } from "@/lib/supabase/types"

type SPWithProgram = SavedProgram & { program: Program }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [spRes, profileRes] = await Promise.all([
    supabase.from("saved_programs").select("*, program:programs(*)").eq("user_id", user.id).order("deadline"),
    supabase.from("applicant_profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
  ])

  const programs = castSavedPrograms(spRes.data) as SPWithProgram[]
  const profileName = (profileRes.data as { full_name?: string } | null)?.full_name
  const programIds = programs.map(p => p.id)

  let requirements: ReturnType<typeof castRequirements> = []
  let essays: ReturnType<typeof castEssays> = []
  let recs: RecommendationRequest[] = []

  if (programIds.length > 0) {
    const [r2, e2, rec2] = await Promise.all([
      supabase.from("program_requirements").select("*").in("saved_program_id", programIds),
      supabase.from("essay_requirements").select("*").in("saved_program_id", programIds),
      supabase.from("recommendation_requests").select("*").in("saved_program_id", programIds),
    ])
    requirements = castRequirements(r2.data)
    essays = castEssays(e2.data)
    recs = castRecs(rec2.data) as RecommendationRequest[]
  }

  const now = new Date()
  const in7 = new Date(now); in7.setDate(now.getDate() + 7)
  const in14 = new Date(now); in14.setDate(now.getDate() + 14)
  const in30 = new Date(now); in30.setDate(now.getDate() + 30)

  const reachCount = programs.filter(p => p.category === "Reach").length
  const targetCount = programs.filter(p => p.category === "Target").length
  const saferCount = programs.filter(p => p.category === "Safer").length

  const reqsRemaining = requirements.filter(r => !["submitted", "waived", "not_applicable"].includes(r.status)).length
  const essaysRemaining = essays.filter(e => !["submitted", "final"].includes(e.status)).length
  const missingPrompts = essays.filter(e => !e.prompt_text).length
  const lowConfidenceReqs = requirements.filter(r => r.confidence_score < 0.5).length
  const submitted = programs.filter(p => p.status === "submitted").length
  const accepted = programs.filter(p => p.status === "accepted").length

  const recPending = recs.filter(r => ["not_asked", "asked"].includes(r.status)).length
  const recSubmitted = recs.filter(r => r.status === "submitted").length

  const upcoming7 = programs.filter(p => p.deadline && new Date(p.deadline) > now && new Date(p.deadline) <= in7)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
  const upcoming14 = programs.filter(p => p.deadline && new Date(p.deadline) > in7 && new Date(p.deadline) <= in14)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
  const upcoming30 = programs.filter(p => p.deadline && new Date(p.deadline) > in14 && new Date(p.deadline) <= in30)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

  const allUpcoming = programs
    .filter(p => p.deadline && new Date(p.deadline) > now)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 6)

  const workload = programs.length > 0 ? calculateApplicationWorkload(programs) : null

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={`${greeting()}, ${profileName?.split(" ")[0] || "Applicant"} ✦`}
        description="Here's where you stand with your applications today."
        actions={
          <Link href="/programs/new">
            <Button className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90">
              <Plus className="w-4 h-4 mr-1.5" /> Add Program
            </Button>
          </Link>
        }
      />

      {programs.length === 0 ? (
        <div className="bg-card rounded-3xl border border-sand/60 shadow-warm p-12 text-center">
          <EmptyState icon="🐣" title="Your nest is empty!" description="Add your first program to start tracking your college applications." />
          <Link href="/programs/new">
            <Button className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90 mt-4">
              <Plus className="w-4 h-4 mr-1.5" /> Add your first program
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Programs" value={programs.length} sub={`${reachCount}R · ${targetCount}T · ${saferCount}S`} icon={GraduationCap} accent="rust" />
            <StatCard label="Essays Remaining" value={essaysRemaining} sub={missingPrompts > 0 ? `${missingPrompts} missing prompt` : "Looking good! 🌸"} icon={PenLine} accent="copper" />
            <StatCard label="Reqs Pending" value={reqsRemaining} sub={lowConfidenceReqs > 0 ? `${lowConfidenceReqs} low confidence` : "All verified 🌿"} icon={ClipboardList} accent="sand" />
            <StatCard label="Submitted" value={submitted} sub={accepted > 0 ? `${accepted} accepted 🎉` : "Keep going!"} icon={TrendingUp} accent="olive" />
          </div>

          {/* Timeline: next 7 / 14 / 30 days */}
          <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-rust flex items-center gap-2">
                <Calendar className="w-4 h-4 text-copper" /> Upcoming Deadlines
              </h2>
              <Link href="/programs" className="text-xs text-copper font-semibold hover:text-sienna flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcoming7.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">🔥 Next 7 days</span>
                  <span className="text-xs text-muted-foreground">{upcoming7.length} deadline{upcoming7.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {upcoming7.map(sp => <DeadlineRow key={sp.id} sp={sp} />)}
                </div>
              </div>
            )}
            {upcoming14.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">⚡ Next 8–14 days</span>
                  <span className="text-xs text-muted-foreground">{upcoming14.length} deadline{upcoming14.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {upcoming14.map(sp => <DeadlineRow key={sp.id} sp={sp} />)}
                </div>
              </div>
            )}
            {upcoming30.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">📅 Next 15–30 days</span>
                  <span className="text-xs text-muted-foreground">{upcoming30.length} deadline{upcoming30.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {upcoming30.map(sp => <DeadlineRow key={sp.id} sp={sp} />)}
                </div>
              </div>
            )}
            {upcoming7.length === 0 && upcoming14.length === 0 && upcoming30.length === 0 && (
              allUpcoming.length > 0 ? (
                <div className="space-y-2">
                  {allUpcoming.map(sp => <DeadlineRow key={sp.id} sp={sp} />)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines in the next 30 days 🎉</p>
              )
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Category breakdown */}
            <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
              <h2 className="font-bold text-rust mb-3 flex items-center gap-2 text-sm">
                <GraduationCap className="w-4 h-4 text-copper" /> Program Mix
              </h2>
              <div className="space-y-2">
                {(["Reach", "Target", "Safer"] as const).map(cat => {
                  const count = cat === "Reach" ? reachCount : cat === "Target" ? targetCount : saferCount
                  const pct = programs.length > 0 ? Math.round((count / programs.length) * 100) : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <CategoryBadge category={cat} />
                        <span className="text-xs font-bold text-rust">{count}</span>
                      </div>
                      <div className="bg-sand/30 rounded-full h-1.5">
                        <div className="progress-bar-copper h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recommenders */}
            <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
              <h2 className="font-bold text-rust mb-3 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-copper" /> Recommenders
              </h2>
              <div className="space-y-2.5">
                {[
                  { label: "Submitted", count: recSubmitted, icon: CheckCircle2, color: "text-olive" },
                  { label: "Pending", count: recPending, icon: Clock, color: "text-amber-600" },
                  { label: "Total LORs", count: recs.length, icon: Users, color: "text-sienna" },
                ].map(({ label, count, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <span className="text-xs text-sienna">{label}</span>
                    </div>
                    <span className={`text-sm font-extrabold ${color}`}>{count}</span>
                  </div>
                ))}
                {recs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Add recommenders in each program detail</p>
                )}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
              <h2 className="font-bold text-rust mb-3 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-copper" /> Attention
              </h2>
              <div className="space-y-2">
                {missingPrompts > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="text-sm">📝</span>
                    <p className="text-xs font-bold text-amber-800">{missingPrompts} essay prompt{missingPrompts !== 1 ? "s" : ""} missing</p>
                  </div>
                )}
                {lowConfidenceReqs > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                    <span className="text-sm">🔴</span>
                    <p className="text-xs font-bold text-red-800">{lowConfidenceReqs} unverified req{lowConfidenceReqs !== 1 ? "s" : ""}</p>
                  </div>
                )}
                {workload && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-cream border border-sand/40">
                    <span className="text-sm">⏱️</span>
                    <div>
                      <p className="text-xs font-bold text-rust">~{workload.estimated_hours}h estimated</p>
                      <p className={`text-xs font-semibold ${workload.risk_level === "high" ? "text-red-600" : workload.risk_level === "medium" ? "text-amber-600" : "text-olive"}`}>
                        {workload.risk_level} risk
                      </p>
                    </div>
                  </div>
                )}
                {missingPrompts === 0 && lowConfidenceReqs === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">All clear! 🌸</p>
                )}
              </div>
            </div>
          </div>

          {/* Programs table */}
          <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-rust">All Programs</h2>
              <Link href="/programs" className="text-xs text-copper font-semibold hover:text-sienna flex items-center gap-1">
                Manage all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand/40">
                    {["Program","Category","Deadline","Status"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-bold text-sienna/60 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {programs.slice(0, 6).map((sp, i) => (
                    <tr key={sp.id} className={`border-b border-sand/20 hover:bg-cream/60 transition-colors ${i % 2 === 1 ? "bg-cream/30" : ""}`}>
                      <td className="py-2.5 px-3">
                        <Link href={`/programs/${sp.id}`} className="hover:text-copper transition-colors block">
                          <p className="font-bold text-rust text-xs">{sp.program?.university}</p>
                          <p className="text-xs text-muted-foreground">{sp.program?.name}</p>
                        </Link>
                      </td>
                      <td className="py-2.5 px-3"><CategoryBadge category={sp.category} /></td>
                      <td className="py-2.5 px-3"><span className="text-sienna text-xs font-medium">{formatDate(sp.deadline)}</span></td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize text-xs bg-sand/30 text-sienna px-2.5 py-0.5 rounded-full font-semibold">
                          {sp.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DeadlineRow({ sp }: { sp: SPWithProgram }) {
  const urgency = deadlineUrgency(sp.deadline)
  const days = daysUntil(sp.deadline)
  return (
    <Link href={`/programs/${sp.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream/80 transition-colors">
      <CategoryBadge category={sp.category} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-rust truncate">{sp.program?.university}</p>
        <p className="text-xs text-muted-foreground truncate">{sp.program?.name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-sienna">{formatDate(sp.deadline)}</p>
        <p className={`text-xs font-bold ${urgency === "urgent" || urgency === "overdue" ? "text-red-600" : urgency === "soon" ? "text-amber-600" : "text-muted-foreground"}`}>
          {days === null ? "" : days <= 0 ? "Due!" : `${days}d left`}
        </p>
      </div>
    </Link>
  )
}
