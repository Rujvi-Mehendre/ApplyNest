import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryBadge, EssayStatusChip, ReqStatusChip, SourceBadge, ConfidenceBadge, ExtractionMethodBadge } from "@/components/shared/StatusChip"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate, daysUntil, deadlineUrgency } from "@/lib/utils"
import { scoreProgramFit } from "@/lib/ai/mock-ai"
import { castRequirements, castEssays, castRecs, castFitScore, castNote, castProfile } from "@/lib/supabase/db"
import { Settings2, ExternalLink, Globe, Calendar } from "lucide-react"
import { AddRequirementDialog } from "@/components/requirements/AddRequirementDialog"
import { RequirementActions } from "@/components/requirements/RequirementActions"
import { AddEssayDialog } from "@/components/essays/AddEssayDialog"
import { EssayActions } from "@/components/essays/EssayActions"
import { PortalPromptDialog } from "@/components/essays/PortalPromptDialog"
import { AIExtractionDialog } from "@/components/programs/AIExtractionDialog"
import { NoteEditor } from "@/components/shared/NoteEditor"
import type { SavedProgram, Program, ApplicantProfile } from "@/lib/supabase/types"

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [spRes, reqRes, essayRes, recRes, fitRes, noteRes, profileRes] = await Promise.all([
    supabase.from("saved_programs").select("*, program:programs(*)").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("program_requirements").select("*").eq("saved_program_id", id).order("created_at"),
    supabase.from("essay_requirements").select("*").eq("saved_program_id", id).order("created_at"),
    supabase.from("recommendation_requests").select("*").eq("saved_program_id", id).order("created_at"),
    supabase.from("program_fit_scores").select("*").eq("saved_program_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("user_notes").select("*").eq("saved_program_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("applicant_profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ])

  if (!spRes.data) notFound()

  const sp = spRes.data as SavedProgram & { program: Program }
  const prog = sp.program
  const requirements = castRequirements(reqRes.data)
  const essays = castEssays(essayRes.data)
  const recs = castRecs(recRes.data)
  const fitScore = castFitScore(fitRes.data)
  const note = castNote(noteRes.data)
  const profile = castProfile(profileRes.data)

  const days = daysUntil(sp.deadline)
  const urgency = deadlineUrgency(sp.deadline)

  const mockFit = fitScore ?? (profile ? scoreProgramFit(profile as ApplicantProfile, { ...prog, category: sp.category }) : null)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/programs" className="text-xs text-copper font-semibold hover:text-sienna mb-3 inline-flex items-center gap-1">
          ← Back to Programs
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-extrabold text-rust">{prog?.university}</h1>
              <CategoryBadge category={sp.category} />
              <span className="text-xs bg-sand/30 text-sienna px-2.5 py-0.5 rounded-full font-semibold capitalize">
                {sp.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-sienna/70">{prog?.name} · {prog?.degree_type} · {prog?.location}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {prog?.website && (
              <a href={prog.website} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="rounded-xl border-sand text-sienna hover:bg-sand/20 h-8 text-xs">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Website
                </Button>
              </a>
            )}
            <Link href={`/programs/${id}/edit`}>
              <Button size="sm" variant="outline" className="rounded-xl border-sand text-sienna hover:bg-sand/20 h-8 text-xs">
                <Settings2 className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Requirements", value: requirements.length },
            { label: "Essays", value: essays.length },
            { label: "Recommenders", value: recs.length },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-sand/60 p-3 text-center">
              <div className="text-lg font-extrabold text-rust">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
          {(() => {
            const terminal = ["submitted","accepted","rejected","withdrawn"].includes(sp.status)
            const label = sp.status.charAt(0).toUpperCase() + sp.status.slice(1)
            return (
              <div className={`bg-card rounded-xl border p-3 text-center ${terminal ? "border-sand/60" : urgency === "urgent" ? "border-red-300 bg-red-50" : urgency === "soon" ? "border-amber-300 bg-amber-50" : "border-sand/60"}`}>
                <div className={`text-lg font-extrabold ${terminal ? "text-olive" : urgency === "urgent" ? "text-red-700" : urgency === "soon" ? "text-amber-700" : "text-rust"}`}>
                  {terminal ? label : days === null ? "—" : days < 0 ? "Overdue" : `${days}d`}
                </div>
                <div className="text-xs text-muted-foreground">{terminal ? (formatDate(sp.deadline) ?? "No deadline") : formatDate(sp.deadline)}</div>
              </div>
            )
          })()}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border border-sand/60 rounded-xl p-1 h-auto gap-1">
          {[
            { value: "overview", label: "Overview" },
            { value: "requirements", label: "Requirements" },
            { value: "essays", label: "Essays" },
            { value: "fit", label: "Fit Analysis" },
            { value: "notes", label: "Notes" },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value}
              className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:gradient-copper data-[state=active]:text-white data-[state=active]:shadow-sm text-sienna">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
            <h3 className="font-bold text-rust mb-3">About this program</h3>
            <p className="text-sm text-sienna/80 leading-relaxed">{prog?.description || "No description available."}</p>
            {sp.notes && (
              <div className="mt-4 p-3 bg-cream rounded-xl border border-sand/40">
                <p className="text-xs font-bold text-sienna mb-1">Your notes</p>
                <p className="text-sm text-sienna/80">{sp.notes}</p>
              </div>
            )}
            {sp.portal_url && (
              <a href={sp.portal_url} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs text-copper font-bold hover:text-sienna">
                <Globe className="w-3.5 h-3.5" /> Open application portal
              </a>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-rust text-sm">Requirements</h3>
                <span className="text-xs text-muted-foreground">{requirements.filter(r => ["submitted","waived"].includes(r.status)).length}/{requirements.length} done</span>
              </div>
              <div className="space-y-2">
                {requirements.slice(0, 4).map(r => (
                  <div key={r.id} className="flex items-center gap-2">
                    <ReqStatusChip status={r.status as Parameters<typeof ReqStatusChip>[0]["status"]} size="sm" />
                    <span className="text-xs text-sienna truncate">{r.title}</span>
                  </div>
                ))}
                {requirements.length === 0 && <p className="text-xs text-muted-foreground">No requirements added</p>}
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-rust text-sm">Essays</h3>
                <span className="text-xs text-muted-foreground">{essays.filter(e => ["submitted","final"].includes(e.status)).length}/{essays.length} done</span>
              </div>
              <div className="space-y-2">
                {essays.slice(0, 4).map(e => (
                  <div key={e.id} className="flex items-center gap-2">
                    <EssayStatusChip status={e.status as Parameters<typeof EssayStatusChip>[0]["status"]} size="sm" />
                    <span className="text-xs text-sienna truncate capitalize">{e.essay_type.replace(/_/g," ")}</span>
                    {e.word_limit && <span className="text-xs text-muted-foreground ml-auto">{e.word_limit}w</span>}
                  </div>
                ))}
                {essays.length === 0 && <p className="text-xs text-muted-foreground">No essays added</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* REQUIREMENTS */}
        <TabsContent value="requirements" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{requirements.length} requirement{requirements.length !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2">
              <AIExtractionDialog
                savedProgramId={id}
                universityName={prog.university}
                programName={prog.name}
                degreeType={prog.degree_type}
                defaultTab="requirements"
                defaultSourceUrl={prog.website ?? sp.portal_url ?? null}
              />
              <AddRequirementDialog savedProgramId={id} />
            </div>
          </div>
          {requirements.length === 0 ? (
            <div className="bg-card rounded-2xl border border-sand/60">
              <EmptyState icon="📋" title="No requirements yet" description="Add requirements like transcripts, test scores, and letters of recommendation." />
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-sand/60 shadow-warm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand/40 bg-cream/20">
                    {["Requirement","Type","Deadline","Source","Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-bold text-sienna/60 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((req, i) => (
                    <tr key={req.id} className={`border-b border-sand/20 hover:bg-cream/40 transition-colors ${i % 2 === 1 ? "bg-cream/20" : ""}`}>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-rust text-xs">{req.title}</p>
                        {req.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{req.description}</p>}
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {req.portal_only && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-semibold">Portal Only</span>}
                          {req.user_verified && <span className="text-xs bg-olive/10 text-olive border border-olive/20 px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</span>}
                          <ConfidenceBadge score={req.confidence_score} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-sand/30 text-sienna px-2 py-0.5 rounded-full font-semibold capitalize">
                          {req.requirement_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-sienna font-medium">{formatDate(req.deadline)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <SourceBadge type={req.source_type as Parameters<typeof SourceBadge>[0]["type"]} />
                      </td>
                      <td className="py-3 px-4">
                        <RequirementActions requirementId={req.id} currentStatus={req.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ESSAYS */}
        <TabsContent value="essays" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{essays.length} essay{essays.length !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2">
              <AIExtractionDialog
                savedProgramId={id}
                universityName={prog.university}
                programName={prog.name}
                degreeType={prog.degree_type}
                defaultTab="essays"
                defaultSourceUrl={prog.website ?? sp.portal_url ?? null}
              />
              <PortalPromptDialog savedProgramId={id} />
              <AddEssayDialog savedProgramId={id} />
            </div>
          </div>
          {essays.length === 0 ? (
            <div className="bg-card rounded-2xl border border-sand/60">
              <EmptyState icon="✍️" title="No essays yet" description="Add essay prompts. Leave prompt text blank for portal-only prompts." />
            </div>
          ) : (
            <div className="grid gap-4">
              {essays.map(essay => (
                <div key={essay.id} className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <EssayStatusChip status={essay.status as Parameters<typeof EssayStatusChip>[0]["status"]} />
                        <span className="text-xs bg-sand/30 text-sienna px-2 py-0.5 rounded-full font-semibold capitalize">
                          {essay.essay_type.replace(/_/g, " ")}
                        </span>
                        {essay.portal_only && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-semibold">🔒 Portal Only</span>}
                        {essay.user_verified && <span className="text-xs bg-olive/10 text-olive border border-olive/20 px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</span>}
                        <ConfidenceBadge score={essay.confidence_score} />
                        <SourceBadge type={essay.source_type as Parameters<typeof SourceBadge>[0]["type"]} />
                        <ExtractionMethodBadge method={essay.extraction_method ?? null} />
                      </div>
                      {essay.prompt_text ? (
                        <p className="text-sm text-sienna/80 leading-relaxed italic line-clamp-3">&ldquo;{essay.prompt_text}&rdquo;</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No prompt text yet — add once visible in the portal.</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                        {essay.word_limit && <span>📏 {essay.word_limit} words</span>}
                        {essay.character_limit && <span>📏 {essay.character_limit} chars</span>}
                        {essay.page_limit && <span>📄 {essay.page_limit} pages</span>}
                        {essay.deadline && (
                          <span className={`font-semibold flex items-center gap-1 ${essay.status === "submitted" ? "text-sienna" : deadlineUrgency(essay.deadline) === "urgent" ? "text-red-600" : "text-sienna"}`}>
                            <Calendar className="w-3 h-3" />{formatDate(essay.deadline)}
                          </span>
                        )}
                        {essay.attached_file_url && (
                          <a href={essay.attached_file_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-copper hover:text-sienna font-semibold">
                            📎 {essay.attached_file_name ?? "Attached file"}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <EssayActions
                        essayId={essay.id}
                        currentStatus={essay.status}
                        promptText={essay.prompt_text}
                        essayType={essay.essay_type}
                        wordLimit={essay.word_limit}
                        characterLimit={essay.character_limit}
                        attachedFileUrl={essay.attached_file_url ?? null}
                        attachedFileName={essay.attached_file_name ?? null}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FIT ANALYSIS */}
        <TabsContent value="fit" className="space-y-4">
          {mockFit ? (
            <>
              <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl gradient-copper flex flex-col items-center justify-center shadow-warm flex-shrink-0">
                    <span className="text-3xl font-extrabold text-white leading-none">{mockFit.overall_score}</span>
                    <span className="text-xs text-white/80 font-semibold">/ 100</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-rust">Overall Fit Score</h3>
                    <p className="text-sm text-muted-foreground">
                      {mockFit.overall_score >= 75 ? "Strong fit 🌟" : mockFit.overall_score >= 55 ? "Moderate fit ✨" : "Competitive reach 🎯"}
                    </p>
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mt-2 inline-block">
                      ⚡ Mock AI score — real scoring coming soon
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {([
                    { label: "GPA Fit", value: mockFit.gpa_fit, icon: "📊" },
                    { label: "Test Score Fit", value: mockFit.test_score_fit, icon: "📝" },
                    { label: "Research Fit", value: mockFit.research_fit, icon: "🔬" },
                    { label: "Experience Fit", value: mockFit.experience_fit, icon: "💼" },
                  ]).map(({ label, value, icon }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-sienna">{icon} {label}</span>
                        <span className="text-sm font-bold text-rust">{value}/100</span>
                      </div>
                      <div className="bg-sand/30 rounded-full h-2.5">
                        <div className="progress-bar-copper h-2.5 rounded-full transition-all" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
                <h3 className="font-bold text-rust mb-3">AI Reasoning</h3>
                <p className="text-sm text-sienna/80 leading-relaxed">{mockFit.reasoning}</p>
              </div>
            </>
          ) : (
            <div className="bg-card rounded-2xl border border-sand/60">
              <EmptyState icon="🔬" title="Complete your profile first" description="Add your GPA and academic background to get a fit score." />
            </div>
          )}
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes">
          <NoteEditor savedProgramId={id} initialContent={note?.content ?? ""} noteId={note?.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
