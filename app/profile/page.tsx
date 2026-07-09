"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/shared/PageHeader"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, X, Upload } from "lucide-react"

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [profileId, setProfileId] = useState<string | null>(null)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [gpa, setGpa] = useState("")
  const [undergradGpa, setUndergradGpa] = useState("")
  const [undergradInstitution, setUndergradInstitution] = useState("")
  const [undergradMajor, setUndergradMajor] = useState("")
  const [greVerbal, setGreVerbal] = useState("")
  const [greQuant, setGreQuant] = useState("")
  const [greWriting, setGreWriting] = useState("")
  const [toefl, setToefl] = useState("")
  const [ielts, setIelts] = useState("")
  const [workYears, setWorkYears] = useState("")
  const [researchExp, setResearchExp] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")

  // Resume text paste
  const [resumeText, setResumeText] = useState("")
  const [parsing, setParsing] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: raw } = await supabase.from("applicant_profiles").select("*").eq("user_id", user.id).single()
      const p = raw as import("@/lib/supabase/types").ApplicantProfile | null
      if (p) {
        setProfileId(p.id)
        setFullName(p.full_name ?? "")
        setEmail(p.email ?? "")
        setPhone(p.phone ?? "")
        setBio(p.bio ?? "")
        setGpa(p.gpa?.toString() ?? "")
        setUndergradGpa(p.undergrad_gpa?.toString() ?? "")
        setUndergradInstitution(p.undergrad_institution ?? "")
        setUndergradMajor(p.undergrad_major ?? "")
        setGreVerbal(p.gre_verbal?.toString() ?? "")
        setGreQuant(p.gre_quant?.toString() ?? "")
        setGreWriting(p.gre_writing?.toString() ?? "")
        setToefl(p.toefl_score?.toString() ?? "")
        setIelts(p.ielts_score?.toString() ?? "")
        setWorkYears(p.work_experience_years?.toString() ?? "")
        setResearchExp(p.research_experience ?? "")
        setSkills(p.skills ?? [])
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      full_name: fullName,
      email,
      phone: phone || null,
      bio: bio || null,
      gpa: gpa ? parseFloat(gpa) : null,
      undergrad_gpa: undergradGpa ? parseFloat(undergradGpa) : null,
      undergrad_institution: undergradInstitution || null,
      undergrad_major: undergradMajor || null,
      gre_verbal: greVerbal ? parseInt(greVerbal) : null,
      gre_quant: greQuant ? parseInt(greQuant) : null,
      gre_writing: greWriting ? parseFloat(greWriting) : null,
      toefl_score: toefl ? parseInt(toefl) : null,
      ielts_score: ielts ? parseFloat(ielts) : null,
      work_experience_years: workYears ? parseInt(workYears) : 0,
      research_experience: researchExp || null,
      skills,
    }

    const { error } = profileId
      ? await supabase.from("applicant_profiles").update(payload).eq("id", profileId)
      : await supabase.from("applicant_profiles").insert(payload)

    if (error) setError(error.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    setSaving(false)
  }

  async function handleParseResume() {
    if (!resumeText.trim()) return
    setParsing(true)
    const { parseResumeToProfile } = await import("@/lib/ai/mock-ai")
    const parsed = parseResumeToProfile(resumeText)
    if (parsed.full_name) setFullName(parsed.full_name)
    if (parsed.email) setEmail(parsed.email)
    if (parsed.undergrad_gpa) setUndergradGpa(parsed.undergrad_gpa.toString())
    if (parsed.gpa) setGpa(parsed.gpa.toString())
    if (parsed.skills?.length) setSkills(prev => [...new Set([...prev, ...parsed.skills!])])
    if (parsed.research_experience) setResearchExp(parsed.research_experience)
    if (parsed.work_experience_years) setWorkYears(parsed.work_experience_years.toString())
    setParsing(false)
    setResumeText("")
  }

  function addSkill() {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
    setSkillInput("")
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-copper" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="My Profile" description="Your academic background used for fit scoring." icon="👤"
        actions={
          <Button onClick={handleSave} disabled={saving}
            className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90 h-9 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "✓ Saved!" : "Save Profile"}
          </Button>
        }
      />

      <form onSubmit={handleSave} className="space-y-5">
        {/* Personal Info */}
        <section className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label className="text-sienna font-semibold text-sm">Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label className="text-sienna font-semibold text-sm">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="rounded-xl border-sand bg-cream" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label className="text-sienna font-semibold text-sm">Bio / Personal Statement Summary</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="A short summary of who you are and what you're pursuing…" className="rounded-xl border-sand bg-cream resize-none" />
          </div>
        </section>

        {/* Academic Background */}
        <section className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Academic Background</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Undergraduate Institution</Label>
              <Input value={undergradInstitution} onChange={e => setUndergradInstitution(e.target.value)} placeholder="e.g. University of California, San Diego" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Undergraduate Major</Label>
              <Input value={undergradMajor} onChange={e => setUndergradMajor(e.target.value)} placeholder="e.g. Computer Science" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Undergraduate GPA</Label>
              <Input type="number" step="0.01" min="0" max="4" value={undergradGpa} onChange={e => setUndergradGpa(e.target.value)} placeholder="e.g. 3.85" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Overall GPA (if different)</Label>
              <Input type="number" step="0.01" min="0" max="4" value={gpa} onChange={e => setGpa(e.target.value)} placeholder="e.g. 3.9" className="rounded-xl border-sand bg-cream" />
            </div>
          </div>
        </section>

        {/* Test Scores */}
        <section className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Test Scores</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">GRE Verbal</Label>
              <Input type="number" value={greVerbal} onChange={e => setGreVerbal(e.target.value)} placeholder="130–170" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">GRE Quant</Label>
              <Input type="number" value={greQuant} onChange={e => setGreQuant(e.target.value)} placeholder="130–170" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">GRE Writing</Label>
              <Input type="number" step="0.5" value={greWriting} onChange={e => setGreWriting(e.target.value)} placeholder="0–6" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">TOEFL Score</Label>
              <Input type="number" value={toefl} onChange={e => setToefl(e.target.value)} placeholder="0–120" className="rounded-xl border-sand bg-cream" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">IELTS Score</Label>
              <Input type="number" step="0.5" value={ielts} onChange={e => setIelts(e.target.value)} placeholder="0–9" className="rounded-xl border-sand bg-cream" />
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Experience</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Years of Work Experience</Label>
              <Input type="number" min="0" value={workYears} onChange={e => setWorkYears(e.target.value)} placeholder="e.g. 2" className="rounded-xl border-sand bg-cream w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sienna font-semibold text-sm">Research Experience</Label>
              <Textarea value={researchExp} onChange={e => setResearchExp(e.target.value)} rows={3} placeholder="Describe your research experience, publications, or lab work…" className="rounded-xl border-sand bg-cream resize-none" />
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Skills & Technologies</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-copper/10 text-copper border border-copper/20 rounded-full px-3 py-1 text-xs font-semibold">
                {s}
                <button type="button" onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="ml-1 hover:text-rust">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {skills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet</p>}
          </div>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Add a skill (press Enter)"
              className="rounded-xl border-sand bg-cream text-sm"
            />
            <Button type="button" onClick={addSkill} size="sm" variant="outline" className="rounded-xl border-sand text-sienna hover:bg-sand/20">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* Resume Parser */}
        <section className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-1">Mock Resume Parser</h2>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-4 inline-block">
            ⚡ Mock AI — paste resume text to auto-fill profile fields
          </p>
          <Textarea
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            rows={6}
            placeholder="Paste your resume text here…"
            className="rounded-xl border-sand bg-cream resize-none text-sm"
          />
          <Button
            type="button"
            onClick={handleParseResume}
            disabled={parsing || !resumeText.trim()}
            className="mt-3 gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90 h-9 text-sm"
          >
            {parsing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {parsing ? "Parsing…" : "Parse Resume (Mock AI)"}
          </Button>
        </section>

        {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm border border-red-200">{error}</div>}

        <Button type="submit" disabled={saving}
          className="w-full gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90 h-11">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "✓ Profile Saved!" : "Save Profile ✦"}
        </Button>
      </form>
    </div>
  )
}
