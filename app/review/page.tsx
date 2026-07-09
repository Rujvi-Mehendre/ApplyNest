import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { castRequirements, castEssays } from "@/lib/supabase/db"
import { ReviewQueueClient } from "@/components/review/ReviewQueueClient"

export const dynamic = "force-dynamic"

export default async function ReviewQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch saved program IDs for this user
  const { data: spRows } = await supabase
    .from("saved_programs")
    .select("id, program:programs(university, name)")
    .eq("user_id", user.id)

  const savedProgramIds = (spRows ?? []).map((sp: { id: string }) => sp.id)
  const spMap: Record<string, { university: string; name: string }> = {}
  for (const sp of spRows ?? []) {
    const p = (sp as unknown as { id: string; program: { university: string; name: string } | null }).program
    if (p) spMap[sp.id] = p
  }

  if (savedProgramIds.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <div className="text-5xl mb-4">🌿</div>
        <h2 className="text-xl font-bold text-rust mb-2">All clear! Your nest is tidy.</h2>
        <p className="text-sienna/60 text-sm">Add programs and requirements to start tracking source quality.</p>
      </div>
    )
  }

  const staleDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [reqRes, essayRes] = await Promise.all([
    supabase
      .from("program_requirements")
      .select("*")
      .in("saved_program_id", savedProgramIds),
    supabase
      .from("essay_requirements")
      .select("*")
      .in("saved_program_id", savedProgramIds),
  ])

  const allReqs = castRequirements(reqRes.data)
  const allEssays = castEssays(essayRes.data)

  // Build review groups
  const missingPrompts = allEssays.filter(e => !e.prompt_text && !e.portal_only)
  const lowConfidence = [
    ...allReqs.filter(r => r.confidence_score < 0.5),
    ...allEssays.filter(e => e.confidence_score < 0.5),
  ]
  const portalOnly = allEssays.filter(e => e.portal_only && !e.prompt_text)
  const noSource = [
    ...allReqs.filter(r => !r.source_url && r.source_type !== "user_entered" && r.source_type !== "portal_entered"),
    ...allEssays.filter(e => !e.source_url && e.source_type !== "user_entered" && e.source_type !== "portal_entered"),
  ]
  const stale = [
    ...allReqs.filter(r => r.extracted_at && (!r.last_checked_at || r.last_checked_at < staleDate)),
    ...allEssays.filter(e => e.extracted_at && (!e.last_checked_at || e.last_checked_at < staleDate)),
  ]

  const totalItems = missingPrompts.length + lowConfidence.length + portalOnly.length + noSource.length + stale.length

  if (totalItems === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <div className="text-5xl mb-4">🌿</div>
        <h2 className="text-xl font-bold text-rust mb-2">All clear! Your nest is tidy.</h2>
        <p className="text-sienna/60 text-sm">No items need review right now. Check back after adding more requirements.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-rust">Review Queue</h1>
        <p className="text-sienna/70 text-sm mt-1">
          {totalItems} item{totalItems !== 1 ? "s" : ""} need attention — verify sources, add missing prompts, or mark as confirmed.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        ⚡ Mock AI — always verify requirements against the official program website before submitting.
      </div>

      <ReviewQueueClient
        missingPrompts={missingPrompts}
        lowConfidence={lowConfidence}
        portalOnly={portalOnly}
        noSource={noSource}
        stale={stale}
        spMap={spMap}
      />
    </div>
  )
}
