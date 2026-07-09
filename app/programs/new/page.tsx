"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Search } from "lucide-react"

const SEED_PROGRAMS = [
  { id: "a1b2c3d4-0001-0000-0000-000000000001", label: "MIT — EECS PhD" },
  { id: "a1b2c3d4-0002-0000-0000-000000000002", label: "Stanford — Computer Science MS" },
  { id: "a1b2c3d4-0003-0000-0000-000000000003", label: "CMU — MCDS" },
  { id: "a1b2c3d4-0004-0000-0000-000000000004", label: "UC Berkeley — MIDS" },
  { id: "a1b2c3d4-0005-0000-0000-000000000005", label: "Georgia Tech — MS Computer Science (OMS)" },
  { id: "a1b2c3d4-0006-0000-0000-000000000006", label: "University of Michigan — MS Applied Data Science" },
  { id: "a1b2c3d4-0007-0000-0000-000000000007", label: "Northeastern — MS Align Computer Science" },
  { id: "a1b2c3d4-0008-0000-0000-000000000008", label: "Boston University — MS Data Science" },
]

export default function AddProgramPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<"existing" | "custom">("existing")
  const [selectedProgramId, setSelectedProgramId] = useState("")
  const [category, setCategory] = useState<"Reach" | "Target" | "Safer">("Target")
  const [status, setStatus] = useState("planning")
  const [deadline, setDeadline] = useState("")
  const [portalUrl, setPortalUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [priority, setPriority] = useState("3")
  const [deliveryMode, setDeliveryMode] = useState("unknown")
  const [appFee, setAppFee] = useState("")

  // Custom program fields
  const [customName, setCustomName] = useState("")
  const [customUniversity, setCustomUniversity] = useState("")
  const [customDepartment, setCustomDepartment] = useState("")
  const [customDegreeType, setCustomDegreeType] = useState("MS")
  const [customLocation, setCustomLocation] = useState("")
  const [customWebsite, setCustomWebsite] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Not authenticated"); setLoading(false); return }

    let programId = selectedProgramId

    if (mode === "custom") {
      const { data: prog, error: progErr } = await supabase
        .from("programs")
        .insert({
          name: customName,
          university: customUniversity,
          department: customDepartment || null,
          degree_type: customDegreeType,
          location: customLocation || null,
          website: customWebsite || null,
        })
        .select("id")
        .single()

      if (progErr || !prog) {
        setError(progErr?.message ?? "Failed to create program")
        setLoading(false)
        return
      }
      programId = prog.id
    }

    const { data: saved, error: saveErr } = await supabase
      .from("saved_programs")
      .insert({
        user_id: user.id,
        program_id: programId,
        category,
        status,
        deadline: deadline || null,
        portal_url: portalUrl || null,
        notes: notes || null,
        priority: parseInt(priority),
        delivery_mode: deliveryMode === "unknown" ? null : deliveryMode,
        app_fee: appFee || null,
      })
      .select("id")
      .single()

    if (saveErr || !saved) {
      setError(saveErr?.message ?? "Failed to save program")
      setLoading(false)
      return
    }

    router.push(`/programs/${saved.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Add Program" description="Add a school to your application list." icon="➕" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Program source toggle */}
        <div className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Select or Create Program</h2>
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setMode("existing")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold border transition-all ${mode === "existing" ? "gradient-copper text-white border-transparent shadow-warm" : "border-sand text-sienna hover:bg-sand/20"}`}>
              Pick from list
            </button>
            <button type="button" onClick={() => setMode("custom")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold border transition-all ${mode === "custom" ? "gradient-copper text-white border-transparent shadow-warm" : "border-sand text-sienna hover:bg-sand/20"}`}>
              Add custom program
            </button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Program</Label>
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId} required>
                <SelectTrigger className="rounded-xl border-sand bg-cream">
                  <SelectValue placeholder="Select a program…" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-sand bg-card">
                  {SEED_PROGRAMS.map(p => (
                    <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sienna font-semibold text-sm">University *</Label>
                  <Input value={customUniversity} onChange={e => setCustomUniversity(e.target.value)} required placeholder="e.g. Harvard University" className="rounded-xl border-sand bg-cream" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sienna font-semibold text-sm">Program Name *</Label>
                  <Input value={customName} onChange={e => setCustomName(e.target.value)} required placeholder="e.g. MS Computer Science" className="rounded-xl border-sand bg-cream" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sienna font-semibold text-sm">Degree Type</Label>
                  <Select value={customDegreeType} onValueChange={setCustomDegreeType}>
                    <SelectTrigger className="rounded-xl border-sand bg-cream"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-sand bg-card max-h-64 overflow-y-auto">
                      {[
                        "BA", "BS", "BFA", "BEng", "BArch", "BBA", "BSN", "BEd",
                        "MS", "MA", "MBA", "MFA", "MEng", "MPH", "MPS", "MPA", "MPP", "MHA", "MSW", "MArch",
                        "PhD", "JD", "LLM", "MD", "DPT", "DNP", "EdD",
                        "Certificate", "Post-Bacc", "Other",
                      ].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sienna font-semibold text-sm">Department</Label>
                  <Input value={customDepartment} onChange={e => setCustomDepartment(e.target.value)} placeholder="e.g. Computer Science" className="rounded-xl border-sand bg-cream" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sienna font-semibold text-sm">Location</Label>
                  <Input value={customLocation} onChange={e => setCustomLocation(e.target.value)} placeholder="e.g. Cambridge, MA" className="rounded-xl border-sand bg-cream" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sienna font-semibold text-sm">Website</Label>
                  <Input value={customWebsite} onChange={e => setCustomWebsite(e.target.value)} placeholder="https://…" className="rounded-xl border-sand bg-cream" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Application details */}
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
                  {["planning", "in_progress", "submitted", "accepted", "rejected", "withdrawn"].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Application Deadline</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Application Portal URL</Label>
              <Input value={portalUrl} onChange={e => setPortalUrl(e.target.value)} placeholder="https://apply.university.edu/…" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Priority (1–5)</Label>
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
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Application Fee</Label>
              <Input value={appFee} onChange={e => setAppFee(e.target.value)} placeholder="e.g. $75, Waived for McNair" className="rounded-xl border-sand bg-cream" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label className="text-sienna font-semibold text-sm">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this program…" rows={3} className="rounded-xl border-sand bg-cream resize-none" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm border border-red-200">{error}</div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl border-sand text-sienna hover:bg-sand/20">
            Cancel
          </Button>
          <Button type="submit" disabled={loading || (mode === "existing" && !selectedProgramId)}
            className="flex-1 gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to my nest ✦"}
          </Button>
        </div>
      </form>
    </div>
  )
}
