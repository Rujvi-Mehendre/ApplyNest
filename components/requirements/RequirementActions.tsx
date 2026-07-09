"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Trash2, RefreshCw } from "lucide-react"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const STATUSES = [
  "not_started", "needed", "requested", "uploaded", "verified",
  "submitted", "waived", "not_applicable",
]

interface Props {
  requirementId: string
  currentStatus: string
}

export function RequirementActions({ requirementId, currentStatus }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus)
    setSaving(true)
    const { error } = await supabase
      .from("program_requirements")
      .update({ status: newStatus })
      .eq("id", requirementId)
    setSaving(false)
    if (error) { toast.error("Failed to update status"); setStatus(currentStatus); return }
    toast.success("Status updated")
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from("program_requirements").delete().eq("id", requirementId)
    setDeleting(false)
    setConfirmDelete(false)
    if (error) { toast.error("Failed to delete requirement"); return }
    toast.success("Requirement deleted")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select value={status} onValueChange={handleStatusChange} disabled={saving}>
        <SelectTrigger className="h-7 text-xs rounded-lg border-sand bg-cream w-[130px]">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
        </SelectTrigger>
        <SelectContent className="rounded-xl border-sand bg-card">
          {STATUSES.map(s => (
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
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(false)}
        title="Delete this requirement?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
