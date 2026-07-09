"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Trash2 } from "lucide-react"

export default function EditProgramPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [category, setCategory] = useState<"Reach" | "Target" | "Safer">("Target")
  const [status, setStatus] = useState("planning")
  const [deadline, setDeadline] = useState("")
  const [portalUrl, setPortalUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [priority, setPriority] = useState("3")
  const [deliveryMode, setDeliveryMode] = useState("unknown")
  const [appFee, setAppFee] = useState("")
  const [programName, setProgramName] = useState("")
  const [university, setUniversity] = useState("")

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("saved_programs")
        .select("*, program:programs(name, university)")
        .eq("id", id)
        .single()
      if (data) {
        setCategory(data.category as "Reach" | "Target" | "Safer")
        setStatus(data.status)
        setDeadline(data.deadline ?? "")
        setPortalUrl(data.portal_url ?? "")
        setNotes(data.notes ?? "")
        setPriority(String(data.priority ?? 3))
        setDeliveryMode(data.delivery_mode ?? "unknown")
        setAppFee(data.app_fee ?? "")
        const prog = data.program as { name: string; university: string }
        setProgramName(prog?.name ?? "")
        setUniversity(prog?.university ?? "")
      }
      setLoading(false)
    }
    load()
  }, [id, supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const { error: saveErr } = await supabase.from("saved_programs").update({
      category,
      status,
      deadline: deadline || null,
      portal_url: portalUrl || null,
      notes: notes || null,
      priority: parseInt(priority),
      delivery_mode: deliveryMode === "unknown" ? null : deliveryMode,
      app_fee: appFee || null,
    }).eq("id", id)
    setSaving(false)
    if (saveErr) { setError(saveErr.message); return }
    toast.success("Changes saved")
    router.push(`/programs/${id}`)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from("saved_programs").delete().eq("id", id)
    toast.success("Program removed from your list")
    router.push("/programs")
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-copper" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={`Edit · ${university}`} description={programName} icon="✏️" />
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Application Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Category</Label>
              <Select value={category} onValueChange={v => setCategory(v as typeof category)}>
                <SelectTrigger className="rounded-xl border-sand bg-cream"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-sand bg-card">
                  <SelectItem value="Reach">🎯 Reach</SelectItem>
                  <SelectItem value="Target">⭐ Target</SelectItem>
                  <SelectItem value="Safer">🛡️ Safer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl border-sand bg-cream"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-sand bg-card">
                  {["planning","in_progress","submitted","accepted","rejected","withdrawn"].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g," ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Application Deadline</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Portal URL</Label>
              <Input value={portalUrl} onChange={e => setPortalUrl(e.target.value)} placeholder="https://…" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="rounded-xl border-sand bg-cream"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-sand bg-card">
                  <SelectItem value="5">⭐⭐⭐⭐⭐ Top Priority</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ High</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ Medium</SelectItem>
                  <SelectItem value="2">⭐⭐ Low</SelectItem>
                  <SelectItem value="1">⭐ Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Delivery Mode</Label>
              <Select value={deliveryMode} onValueChange={setDeliveryMode}>
                <SelectTrigger className="rounded-xl border-sand bg-cream"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-sand bg-card">
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="in_person">🏫 In Person</SelectItem>
                  <SelectItem value="online">💻 Online</SelectItem>
                  <SelectItem value="hybrid">🔄 Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-sienna font-semibold text-sm">Application Fee</Label>
              <Input value={appFee} onChange={e => setAppFee(e.target.value)} placeholder="e.g. $75, Waived for McNair" className="rounded-xl border-sand bg-cream" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label className="text-sienna font-semibold text-sm">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="rounded-xl border-sand bg-cream resize-none" />
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm border border-red-200">{error}</div>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl border-sand text-sienna">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1 gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)} disabled={deleting}
            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(false)}
        title="Remove this program?"
        description="This will delete all requirements, essays, and notes for this program."
        confirmLabel="Remove"
        danger
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
