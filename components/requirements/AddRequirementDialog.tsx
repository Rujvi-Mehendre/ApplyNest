"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { Plus, Loader2 } from "lucide-react"

interface Props { savedProgramId: string }

export function AddRequirementDialog({ savedProgramId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [type, setType] = useState("other")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("not_started")
  const [deadline, setDeadline] = useState("")
  const [sourceType, setSourceType] = useState("user_entered")
  const [sourceUrl, setSourceUrl] = useState("")
  const [portalOnly, setPortalOnly] = useState(false)
  const [userVerified, setUserVerified] = useState(false)
  const [notes, setNotes] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from("program_requirements").insert({
      saved_program_id: savedProgramId,
      title,
      requirement_type: type,
      description: description || null,
      status,
      deadline: deadline || null,
      source_type: sourceType,
      source_url: sourceUrl || null,
      confidence_score: userVerified ? 1.0 : sourceType === "official" ? 0.9 : 0.7,
      portal_only: portalOnly,
      user_verified: userVerified,
      notes: notes || null,
    })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Requirement
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-sand rounded-3xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-rust font-extrabold">Add Requirement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sienna font-semibold text-sm">Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Official Transcripts" className="rounded-xl border-sand bg-cream" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl border-sand bg-cream text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-sand bg-card">
                  {[["transcript","Transcript"],["test_score","Test Score"],["lor","Letter of Rec"],["sop","SOP"],["resume","Resume"],["portfolio","Portfolio"],["other","Other"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl border-sand bg-cream text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-sand bg-card">
                  {["not_started","needed","requested","uploaded","verified","submitted","waived","not_applicable"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sienna font-semibold text-sm">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Any details about this requirement…" className="rounded-xl border-sand bg-cream resize-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Deadline</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-xl border-sand bg-cream text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Source Type</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger className="rounded-xl border-sand bg-cream text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-sand bg-card">
                  {[["official","Official"],["user_entered","User Entered"],["portal_only","Portal Only"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sienna font-semibold text-sm">Source URL</Label>
            <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://…" className="rounded-xl border-sand bg-cream text-sm" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch id="portal-only" checked={portalOnly} onCheckedChange={setPortalOnly} />
              <Label htmlFor="portal-only" className="text-sm text-sienna font-semibold cursor-pointer">Portal Only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="verified" checked={userVerified} onCheckedChange={setUserVerified} />
              <Label htmlFor="verified" className="text-sm text-sienna font-semibold cursor-pointer">I verified this</Label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-sand text-sienna">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Requirement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
