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

export function AddEssayDialog({ savedProgramId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [promptText, setPromptText] = useState("")
  const [essayType, setEssayType] = useState("sop")
  const [wordLimit, setWordLimit] = useState("")
  const [charLimit, setCharLimit] = useState("")
  const [deadline, setDeadline] = useState("")
  const [sourceType, setSourceType] = useState("user_entered")
  const [sourceUrl, setSourceUrl] = useState("")
  const [portalOnly, setPortalOnly] = useState(false)
  const [userVerified, setUserVerified] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from("essay_requirements").insert({
      saved_program_id: savedProgramId,
      prompt_text: promptText || null,
      essay_type: essayType,
      word_limit: wordLimit ? parseInt(wordLimit) : null,
      character_limit: charLimit ? parseInt(charLimit) : null,
      deadline: deadline || null,
      status: "not_started",
      source_type: sourceType,
      source_url: sourceUrl || null,
      confidence_score: userVerified ? 1.0 : sourceType === "official" ? 0.9 : 0.7,
      portal_only: portalOnly,
      user_verified: userVerified,
    })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Essay
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-sand rounded-3xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-rust font-extrabold">Add Essay Prompt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sienna font-semibold text-sm">Essay Type</Label>
            <Select value={essayType} onValueChange={setEssayType}>
              <SelectTrigger className="rounded-xl border-sand bg-cream"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl border-sand bg-card">
                {[["sop","Statement of Purpose"],["personal_statement","Personal Statement"],["diversity","Diversity Essay"],["why_school","Why This School"],["short_answer","Short Answer"],["other","Other"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sienna font-semibold text-sm">Prompt Text</Label>
            <Textarea value={promptText} onChange={e => setPromptText(e.target.value)} rows={4} placeholder="Paste the exact essay prompt here. Leave blank if portal-only." className="rounded-xl border-sand bg-cream resize-none text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-xs">Word Limit</Label>
              <Input type="number" value={wordLimit} onChange={e => setWordLimit(e.target.value)} placeholder="e.g. 500" className="rounded-xl border-sand bg-cream text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-xs">Char Limit</Label>
              <Input type="number" value={charLimit} onChange={e => setCharLimit(e.target.value)} placeholder="e.g. 2000" className="rounded-xl border-sand bg-cream text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-xs">Deadline</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-xl border-sand bg-cream text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Source Type</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger className="rounded-xl border-sand bg-cream text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-sand bg-card">
                  {[["official","Official"],["user_entered","User Entered"],["portal_only","Portal Only"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Source URL</Label>
              <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://…" className="rounded-xl border-sand bg-cream text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch id="portal-only-e" checked={portalOnly} onCheckedChange={setPortalOnly} />
              <Label htmlFor="portal-only-e" className="text-sm text-sienna font-semibold cursor-pointer">Portal Only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="verified-e" checked={userVerified} onCheckedChange={setUserVerified} />
              <Label htmlFor="verified-e" className="text-sm text-sienna font-semibold cursor-pointer">I verified this</Label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-sand text-sienna">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Essay"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
