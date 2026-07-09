"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DraftEditorDialog } from "./DraftEditorDialog"
import { createClient } from "@/lib/supabase/client"
import { Trash2, PenLine, Paperclip } from "lucide-react"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const ESSAY_STATUSES = ["not_started", "outline", "draft_1", "revised", "final", "submitted"]

interface Props {
  essayId: string
  currentStatus: string
  promptText: string | null
  essayType: string
  wordLimit: number | null
  characterLimit: number | null
  attachedFileUrl: string | null
  attachedFileName: string | null
}

export function EssayActions({ essayId, currentStatus, promptText, essayType, wordLimit, characterLimit, attachedFileUrl, attachedFileName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState(currentStatus)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)

  async function handleStatusChange(newStatus: string) {
    const prev = status
    setStatus(newStatus)
    const { error } = await supabase.from("essay_requirements").update({ status: newStatus }).eq("id", essayId)
    if (error) { toast.error("Failed to update status"); setStatus(prev); return }
    toast.success("Status updated")
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from("essay_requirements").delete().eq("id", essayId)
    setDeleting(false)
    setConfirmDelete(false)
    if (error) { toast.error("Failed to delete essay"); return }
    toast.success("Essay deleted")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button size="sm" variant="outline" onClick={() => setEditorOpen(true)}
        className="h-7 px-2.5 rounded-lg border-sand text-sienna text-xs hover:bg-sand/20 flex-shrink-0 relative">
        {attachedFileUrl ? <Paperclip className="w-3 h-3 mr-1 text-olive" /> : <PenLine className="w-3 h-3 mr-1" />}
        {attachedFileUrl ? "File" : "Draft"}
        {attachedFileUrl && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-olive" />}
      </Button>
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="h-7 text-xs rounded-lg border-sand bg-cream w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-sand bg-card">
          {ESSAY_STATUSES.map(s => (
            <SelectItem key={s} value={s} className="text-xs capitalize rounded-lg">
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(true)}
        className="h-7 w-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </Button>

      <DraftEditorDialog
        essayId={essayId}
        promptText={promptText}
        essayType={essayType}
        wordLimit={wordLimit}
        characterLimit={characterLimit}
        initialStatus={status}
        attachedFileUrl={attachedFileUrl}
        attachedFileName={attachedFileName}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(false)}
        title="Delete this essay?"
        description="This will also delete all drafts. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
