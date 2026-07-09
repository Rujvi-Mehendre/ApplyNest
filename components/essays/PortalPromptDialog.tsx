"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Lock } from "lucide-react"
import type { EssayRequirement } from "@/lib/supabase/types"

const ESSAY_TYPES: { value: EssayRequirement["essay_type"]; label: string }[] = [
  { value: "sop", label: "Statement of Purpose" },
  { value: "personal_statement", label: "Personal Statement" },
  { value: "why_school", label: "Why This School?" },
  { value: "diversity", label: "Diversity & Inclusion" },
  { value: "short_answer", label: "Short Answer" },
  { value: "other", label: "Other" },
]

interface Props {
  savedProgramId: string
}

export function PortalPromptDialog({ savedProgramId }: Props) {
  const [open, setOpen] = useState(false)
  const [essayType, setEssayType] = useState<EssayRequirement["essay_type"]>("other")
  const [promptText, setPromptText] = useState("")
  const [wordLimit, setWordLimit] = useState("")
  const [charLimit, setCharLimit] = useState("")
  const [pageLimit, setPageLimit] = useState("")
  const [deadline, setDeadline] = useState("")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!promptText.trim()) { toast.error("Prompt text is required"); return }
    setSaving(true)

    const now = new Date().toISOString()
    const { data: essay, error } = await supabase
      .from("essay_requirements")
      .insert({
        saved_program_id: savedProgramId,
        essay_type: essayType,
        prompt_text: promptText.trim(),
        word_limit: wordLimit ? parseInt(wordLimit) : null,
        character_limit: charLimit ? parseInt(charLimit) : null,
        page_limit: pageLimit ? parseInt(pageLimit) : null,
        deadline: deadline || null,
        notes: notes || null,
        status: "not_started",
        source_type: "portal_entered",
        source_title: "Application Portal (manual entry)",
        confidence_score: 0.95,
        user_verified: true,
        portal_only: false,
        official_domain_match: false,
        extraction_method: "portal_entered",
        extracted_at: now,
        last_checked_at: now,
      })
      .select()
      .single()

    if (error) {
      setSaving(false)
      toast.error("Failed to save prompt")
      return
    }

    // TODO: Upload file evidence to Supabase Storage
    // Requires 'prompt-evidence' bucket (Storage → New bucket → prompt-evidence → Private)
    // Then uncomment:
    // if (file && essay) {
    //   const { data: uploadData, error: uploadError } = await supabase.storage
    //     .from("prompt-evidence")
    //     .upload(`${(await supabase.auth.getUser()).data.user?.id}/${essay.id}/${file.name}`, file)
    //   if (!uploadError && uploadData) {
    //     await supabase.from("prompt_evidence").insert({
    //       essay_requirement_id: essay.id,
    //       user_id: (await supabase.auth.getUser()).data.user!.id,
    //       file_name: file.name,
    //       file_url: uploadData.path,
    //       file_type: file.name.endsWith(".pdf") ? "pdf" : "screenshot",
    //     })
    //   }
    // }

    setSaving(false)
    toast.success("Portal prompt saved")
    setOpen(false)
    setPromptText("")
    setWordLimit("")
    setCharLimit("")
    setPageLimit("")
    setDeadline("")
    setNotes("")
    setFile(null)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 h-8 text-xs gap-1.5">
          <Lock className="w-3 h-3" /> Add Portal Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-rust">Add Portal Prompt</DialogTitle>
          <p className="text-xs text-sienna/70 mt-1">
            For essay prompts only visible after creating an application account. Paste the prompt here and mark it as verified.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-bold text-sienna block mb-1">Essay Type *</label>
            <select
              value={essayType}
              onChange={e => setEssayType(e.target.value as EssayRequirement["essay_type"])}
              className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
            >
              {ESSAY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-sienna block mb-1">
              Prompt Text * <span className="text-sienna/50 font-normal">(paste from application portal)</span>
            </label>
            <textarea
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="Please describe your academic background..."
              rows={4}
              className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-sienna block mb-1">Word Limit</label>
              <input
                type="number"
                value={wordLimit}
                onChange={e => setWordLimit(e.target.value)}
                placeholder="e.g. 500"
                className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-sienna block mb-1">Char Limit</label>
              <input
                type="number"
                value={charLimit}
                onChange={e => setCharLimit(e.target.value)}
                placeholder="e.g. 3000"
                className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-sienna block mb-1">Page Limit</label>
              <input
                type="number"
                value={pageLimit}
                onChange={e => setPageLimit(e.target.value)}
                placeholder="e.g. 2"
                className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-sienna block mb-1">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-sienna block mb-1">Notes</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-sienna block mb-1">
              Evidence (optional) <span className="text-sienna/50 font-normal">— screenshot or PDF of portal page</span>
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-sienna/70 file:mr-3 file:text-xs file:font-semibold file:border file:border-sand/60 file:rounded-lg file:bg-cream file:text-sienna file:px-3 file:py-1 hover:file:bg-sand/20"
            />
            {/* TODO: Enable file upload by creating 'prompt-evidence' bucket in Supabase Storage */}
            <p className="text-xs text-sienna/40 mt-1">File upload coming soon — bucket setup required.</p>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}
              className="rounded-xl border-sand text-sienna hover:bg-sand/20">
              Cancel
            </Button>
            <Button type="submit" disabled={saving}
              className="rounded-xl gradient-copper text-white hover:opacity-90">
              {saving ? "Saving…" : "Save Prompt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
