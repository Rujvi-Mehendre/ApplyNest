import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/DashboardLayout"
import { castEssays } from "@/lib/supabase/db"
import { getProviders } from "@/lib/providers"
import { SimilarPromptsClient } from "@/components/essays/SimilarPromptsClient"

export const dynamic = "force-dynamic"

export default async function SimilarPromptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: spRows } = await supabase
    .from("saved_programs")
    .select("id, program:programs(university, name)")
    .eq("user_id", user.id)

  const savedProgramIds = (spRows ?? []).map((sp: { id: string }) => sp.id)
  const spMap: Record<string, string> = {}
  for (const sp of spRows ?? []) {
    const p = (sp as unknown as { id: string; program: { university: string; name: string } | null }).program
    if (p) spMap[sp.id] = `${p.university} — ${p.name}`
  }

  let essays = castEssays([])
  if (savedProgramIds.length > 0) {
    const { data } = await supabase
      .from("essay_requirements")
      .select("*")
      .in("saved_program_id", savedProgramIds)
    essays = castEssays(data)
  }

  // TODO: Replace MockEssaySimilarityProvider with real semantic embeddings — see lib/providers/index.ts
  const providers = getProviders()
  const groups = providers.essaySimilarity.createPromptGroups(essays)
  const drafts = providers.essaySimilarity.suggestReusableDrafts(groups)

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-rust">Similar Prompts</h1>
          <p className="text-sienna/70 text-sm mt-1">
            Group similar essay prompts across your programs and reuse your best work.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
          ⚡ Mock AI grouping — groups are based on essay type, not semantic similarity. Always review prompts carefully before reusing drafts.
        </div>

        <SimilarPromptsClient groups={groups} drafts={drafts} spMap={spMap} totalEssays={essays.length} />
      </div>
    </DashboardShell>
  )
}
