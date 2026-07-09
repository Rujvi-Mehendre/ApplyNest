"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Save, Loader2 } from "lucide-react"

interface Props {
  savedProgramId: string
  initialContent: string
  noteId?: string
}

export function NoteEditor({ savedProgramId, initialContent, noteId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (noteId) {
      await supabase.from("user_notes").update({ content }).eq("id", noteId)
    } else {
      await supabase.from("user_notes").insert({ user_id: user.id, saved_program_id: savedProgramId, content })
    }

    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-rust">Notes</h3>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={loading}
          className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90 h-8 text-xs"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? "✓ Saved!" : <><Save className="w-3.5 h-3.5 mr-1" />Save</>}
        </Button>
      </div>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={12}
        placeholder="Add your notes, thoughts, and reminders about this program here…"
        className="rounded-xl border-sand bg-cream resize-none text-sm leading-relaxed"
      />
      <p className="text-xs text-muted-foreground mt-2">Plain text notes — use this for thoughts, reminders, and links.</p>
    </div>
  )
}
