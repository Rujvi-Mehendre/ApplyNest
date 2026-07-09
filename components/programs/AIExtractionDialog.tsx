"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sparkles, Loader2, ClipboardPaste, Globe, ExternalLink } from "lucide-react"
import { ExtractionItemCard } from "./ExtractionItemCard"
import type { RequirementItem, EssayItem } from "@/lib/ai/extraction-schemas"

type AnyItem = RequirementItem | EssayItem
type Step = "input" | "fetching" | "preview" | "extracting" | "review" | "saving"
type InputMode = "paste" | "url"

const SOURCE_TYPES = [
  { value: "official", label: "Official university / program page" },
  { value: "unofficial", label: "Unofficial source (forum, blog, etc.)" },
  { value: "portal_entered", label: "Application portal" },
  { value: "user_entered", label: "User notes" },
  { value: "unknown", label: "Unknown" },
]

interface Props {
  savedProgramId: string
  universityName: string
  programName: string
  degreeType: string
  defaultTab?: "requirements" | "essays"
  defaultSourceUrl?: string | null
}

export function AIExtractionDialog({ savedProgramId, universityName, programName, degreeType, defaultTab, defaultSourceUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("input")
  const [mode, setMode] = useState<InputMode>("url")

  // Shared
  const [sourceUrl, setSourceUrl] = useState(defaultSourceUrl ?? "")
  const [sourceType, setSourceType] = useState("official")
  const [userNotes, setUserNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Paste mode
  const [pastedText, setPastedText] = useState("")

  // Results
  const [runId, setRunId] = useState<string | null>(null)
  const [summary, setSummary] = useState("")
  const [items, setItems] = useState<AnyItem[]>([])
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [pagesFetched, setPagesFetched] = useState<string[]>([])
  const [fetchedText, setFetchedText] = useState("")

  const router = useRouter()
  const supabase = createClient()

  function reset() {
    setStep("input")
    setMode("url")
    setPastedText("")
    setSourceUrl(defaultSourceUrl ?? "")
    setSourceType("official")
    setUserNotes("")
    setError(null)
    setRunId(null)
    setSummary("")
    setItems([])
    setChecked(new Set())
    setPagesFetched([])
    setFetchedText("")
  }

  async function runExtraction(inputText: string, url: string) {
    setError(null)
    setStep("extracting")
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saved_program_id: savedProgramId,
          input_text: inputText,
          source_url: url || undefined,
          source_type: sourceType,
          university_name: universityName,
          program_name: programName,
          degree_type: degreeType,
          user_notes: userNotes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Extraction failed. Please try again.")
        setStep("input")
        return
      }
      const allItems: AnyItem[] = [...(data.requirements ?? []), ...(data.essays ?? [])]
      setRunId(data.run_id)
      setSummary(data.summary ?? "")
      setItems(allItems)
      const autoChecked = new Set<number>()
      allItems.forEach((item, i) => {
        const isCorrectTab = !defaultTab
          || (defaultTab === "requirements" && item.item_type === "requirement")
          || (defaultTab === "essays" && item.item_type === "essay")
        if (item.confidence_score >= 0.75 && isCorrectTab) autoChecked.add(i)
      })
      setChecked(autoChecked)
      setStep("review")
    } catch {
      setError("Network error. Please check your connection and try again.")
      setStep("input")
    }
  }

  async function handleFetchAndExtract(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceUrl) { setError("Please enter a URL."); return }
    setError(null)
    setStep("fetching")
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Could not fetch that URL.")
        setStep("input")
        return
      }
      setPagesFetched(data.pages_fetched ?? [sourceUrl])
      setFetchedText(data.text ?? "")
      setStep("preview")
    } catch {
      setError("Failed to fetch URL. Check your connection or try pasting the text instead.")
      setStep("input")
    }
  }

  async function handlePasteExtract(e: React.FormEvent) {
    e.preventDefault()
    if (pastedText.trim().length < 20) {
      setError("Please paste more text (at least a few sentences).")
      return
    }
    setPagesFetched(sourceUrl ? [sourceUrl] : [])
    await runExtraction(pastedText, sourceUrl)
  }

  function toggleItem(index: number) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function approveHighConfidence() {
    const next = new Set<number>()
    items.forEach((item, i) => { if (item.confidence_score >= 0.75) next.add(i) })
    setChecked(next)
  }

  function updateItem(index: number, updated: AnyItem) {
    setItems(prev => prev.map((item, i) => i === index ? updated : item))
  }

  async function handleSave() {
    const now = new Date().toISOString()
    const approvedItems = [...checked].map(i => items[i])
    if (approvedItems.length === 0) { toast.error("No items selected to save."); return }
    setStep("saving")
    let saved = 0; let failed = 0

    for (const item of approvedItems) {
      if (item.item_type === "requirement") {
        const req = item as RequirementItem
        const { error } = await supabase.from("program_requirements").insert({
          saved_program_id: savedProgramId,
          requirement_type: req.requirement_type,
          title: req.title,
          description: req.description ?? null,
          status: "not_started",
          deadline: req.deadline ?? null,
          source_url: sourceUrl || null,
          source_excerpt: req.source_excerpt ?? null,
          source_type: sourceType,
          confidence_score: req.confidence_score,
          user_verified: false,
          portal_only: false,
          notes: null,
          source_title: sourceUrl ? new URL(sourceUrl).hostname : null,
          official_domain_match: sourceType === "official",
          extraction_method: "ai_extracted",
          extracted_at: now,
          last_checked_at: now,
        })
        if (error) failed++; else saved++
      } else {
        const essay = item as EssayItem
        const { error } = await supabase.from("essay_requirements").insert({
          saved_program_id: savedProgramId,
          essay_type: essay.essay_type,
          prompt_text: essay.exact_prompt ?? null,
          word_limit: essay.word_limit ?? null,
          character_limit: essay.character_limit ?? null,
          page_limit: essay.page_limit ?? null,
          deadline: essay.deadline ?? null,
          status: "not_started",
          source_url: sourceUrl || null,
          source_excerpt: essay.source_excerpt ?? null,
          source_type: sourceType,
          confidence_score: essay.confidence_score,
          user_verified: false,
          portal_only: essay.portal_only,
          notes: null,
          source_title: sourceUrl ? new URL(sourceUrl).hostname : null,
          official_domain_match: sourceType === "official",
          extraction_method: "ai_extracted",
          extracted_at: now,
          last_checked_at: now,
        })
        if (error) failed++; else saved++
      }
    }

    if (runId) {
      await supabase.from("ai_extracted_items")
        .update({ status: "saved" })
        .eq("extraction_run_id", runId)
    }

    if (failed > 0) toast.error(`${failed} item${failed !== 1 ? "s" : ""} failed to save.`)
    if (saved > 0) toast.success(`${saved} item${saved !== 1 ? "s" : ""} saved.`)
    router.refresh()
    setOpen(false)
    reset()
  }

  const reqItems = items.filter(i => i.item_type === "requirement")
  const essayItems = items.filter(i => i.item_type === "essay")
  const checkedCount = checked.size

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl border-copper/30 text-copper hover:bg-copper/10 h-8 text-xs gap-1.5">
          <Sparkles className="w-3 h-3" /> Extract from URL
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-rust flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-copper" />
            AI Requirement Extraction
          </DialogTitle>
          <p className="text-xs text-sienna/70 mt-1">
            Give the AI a program URL or paste text — it will extract requirements and essay prompts for your review.
          </p>
        </DialogHeader>

        {/* INPUT STEP */}
        {step === "input" && (
          <div className="space-y-4 mt-2">
            {/* Mode tabs */}
            <div className="flex gap-1 bg-cream rounded-xl p-1 border border-sand/60">
              <button
                type="button"
                onClick={() => { setMode("url"); setError(null) }}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg transition-all ${mode === "url" ? "bg-card shadow text-rust" : "text-sienna/60 hover:text-sienna"}`}
              >
                <Globe className="w-3.5 h-3.5" />Fetch from URL
              </button>
              <button
                type="button"
                onClick={() => { setMode("paste"); setError(null) }}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg transition-all ${mode === "paste" ? "bg-card shadow text-rust" : "text-sienna/60 hover:text-sienna"}`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />Paste text
              </button>
            </div>

            {/* URL mode */}
            {mode === "url" && (
              <form onSubmit={handleFetchAndExtract} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-sienna block mb-1">Program or admissions page URL *</label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                    placeholder="https://cs.university.edu/graduate/admissions/"
                    required
                    className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
                  />
                  <p className="text-xs text-sienna/50 mt-1">
                    The app will fetch this page and automatically follow relevant sub-links (admissions, requirements, apply).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-sienna block mb-1">Source Type</label>
                    <select
                      value={sourceType}
                      onChange={e => setSourceType(e.target.value)}
                      className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
                    >
                      {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-sienna block mb-1">Notes for AI (optional)</label>
                    <input
                      value={userNotes}
                      onChange={e => setUserNotes(e.target.value)}
                      placeholder="e.g. Focus on the MS requirements"
                      className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}
                    className="rounded-xl border-sand text-sienna hover:bg-sand/20">Cancel</Button>
                  <Button type="submit" disabled={!sourceUrl}
                    className="rounded-xl gradient-copper text-white hover:opacity-90 gap-2">
                    <Globe className="w-3.5 h-3.5" />Fetch & Extract
                  </Button>
                </div>
              </form>
            )}

            {/* Paste mode */}
            {mode === "paste" && (
              <form onSubmit={handlePasteExtract} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-sienna block mb-1">Paste admissions text *</label>
                  <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder="Paste text from an official program or admissions page here — requirements, deadlines, essay prompts, etc."
                    rows={8}
                    className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-1 focus:ring-copper resize-none"
                  />
                  <p className="text-xs text-sienna/40 mt-1">{pastedText.length} characters</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-sienna block mb-1">Source URL (optional)</label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={e => setSourceUrl(e.target.value)}
                      placeholder="https://admissions.university.edu/..."
                      className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-sienna block mb-1">Source Type</label>
                    <select
                      value={sourceType}
                      onChange={e => setSourceType(e.target.value)}
                      className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
                    >
                      {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-sienna block mb-1">Notes for AI (optional)</label>
                  <input
                    value={userNotes}
                    onChange={e => setUserNotes(e.target.value)}
                    placeholder="e.g. This is the application requirements page, not the program overview"
                    className="w-full text-sm border border-sand/60 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}
                    className="rounded-xl border-sand text-sienna hover:bg-sand/20">Cancel</Button>
                  <Button type="submit" disabled={pastedText.trim().length < 20}
                    className="rounded-xl gradient-copper text-white hover:opacity-90 gap-2">
                    <Sparkles className="w-3.5 h-3.5" />Extract Requirements
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* PREVIEW STEP */}
        {step === "preview" && (
          <div className="space-y-4 mt-2">
            <div className="bg-olive/10 border border-olive/20 rounded-xl px-4 py-3 space-y-2">
              <p className="text-xs font-bold text-olive">
                ✓ {pagesFetched.length} page{pagesFetched.length !== 1 ? "s" : ""} fetched
                · {fetchedText.length.toLocaleString()} characters
              </p>
              {pagesFetched.map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-copper hover:text-sienna truncate">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />{url}
                </a>
              ))}
            </div>

            {fetchedText.length < 500 ? (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                ⚠️ Very little text was returned ({fetchedText.length} chars). This page may require JavaScript to render — try the "Paste text" mode instead by copying the page content manually.
              </div>
            ) : (
              <div className="bg-cream rounded-xl border border-sand/40 p-3">
                <p className="text-xs font-bold text-sienna mb-1.5">Preview of fetched content</p>
                <p className="text-xs text-sienna/70 leading-relaxed whitespace-pre-wrap font-mono">
                  {fetchedText.slice(0, 600)}{fetchedText.length > 600 ? "…" : ""}
                </p>
              </div>
            )}

            <p className="text-xs text-sienna/50">
              If the preview looks empty or shows navigation menus instead of requirements, the site renders via JavaScript. Use "Paste text" mode.
            </p>

            <div className="flex justify-end gap-2 pt-1 border-t border-sand/40">
              <Button type="button" variant="outline" onClick={() => setStep("input")}
                className="rounded-xl border-sand text-sienna hover:bg-sand/20">
                ← Back
              </Button>
              <Button
                onClick={() => runExtraction(fetchedText, sourceUrl)}
                disabled={fetchedText.length < 100}
                className="rounded-xl gradient-copper text-white hover:opacity-90 gap-2">
                <Sparkles className="w-3.5 h-3.5" />Extract with AI
              </Button>
            </div>
          </div>
        )}

        {/* FETCHING STEP */}
        {step === "fetching" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Globe className="w-8 h-8 text-copper animate-pulse" />
            <p className="text-sm font-semibold text-sienna">Fetching pages…</p>
            <p className="text-xs text-sienna/50">Reading {sourceUrl} and following relevant sub-links</p>
          </div>
        )}

        {/* EXTRACTING STEP */}
        {step === "extracting" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-8 h-8 text-copper animate-spin" />
            <p className="text-sm font-semibold text-sienna">Analyzing with AI…</p>
            <p className="text-xs text-sienna/50">
              {pagesFetched.length > 1
                ? `Extracting from ${pagesFetched.length} pages`
                : "Extracting requirements and essay prompts"}
            </p>
          </div>
        )}

        {/* REVIEW STEP */}
        {step === "review" && (
          <div className="space-y-5 mt-2">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
              ⚡ AI extraction — always verify requirements against the official program website before submitting.
            </div>

            {pagesFetched.length > 0 && (
              <div className="bg-cream rounded-xl border border-sand/40 px-4 py-3 space-y-1">
                <p className="text-xs font-bold text-sienna">
                  {pagesFetched.length} page{pagesFetched.length !== 1 ? "s" : ""} read
                </p>
                {pagesFetched.map(url => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-copper hover:text-sienna truncate">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />{url}
                  </a>
                ))}
              </div>
            )}

            {summary && (
              <p className="text-sm text-sienna/80 italic bg-cream/60 rounded-xl px-4 py-3 border border-sand/40">
                {summary}
              </p>
            )}

            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">🔍</div>
                <p className="text-sienna font-semibold">No items found</p>
                <p className="text-sienna/60 text-sm mt-1">
                  The AI could not extract requirements from this page. The site may block automated access — try the "Paste text" mode instead.
                </p>
              </div>
            ) : (
              <>
                {reqItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-rust mb-3">
                      Requirements <span className="text-sienna/50 font-normal">({reqItems.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {reqItems.map(item => {
                        const globalIndex = items.indexOf(item)
                        return (
                          <ExtractionItemCard key={globalIndex} item={item}
                            checked={checked.has(globalIndex)}
                            onToggle={() => toggleItem(globalIndex)}
                            onChange={updated => updateItem(globalIndex, updated)}
                            sourceType={sourceType} />
                        )
                      })}
                    </div>
                  </div>
                )}

                {essayItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-rust mb-3">
                      Essay Prompts <span className="text-sienna/50 font-normal">({essayItems.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {essayItems.map(item => {
                        const globalIndex = items.indexOf(item)
                        return (
                          <ExtractionItemCard key={globalIndex} item={item}
                            checked={checked.has(globalIndex)}
                            onToggle={() => toggleItem(globalIndex)}
                            onChange={updated => updateItem(globalIndex, updated)}
                            sourceType={sourceType} />
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-sand/40 sticky bottom-0 bg-background pb-1">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={approveHighConfidence}
                  className="rounded-xl border-sand text-sienna hover:bg-sand/20 text-xs h-8">
                  ✓ Approve ≥75% confidence
                </Button>
                <span className="text-xs text-sienna/50">{checkedCount} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setOpen(false); reset() }}
                  className="rounded-xl border-sand text-sienna hover:bg-sand/20 text-xs h-8">Discard</Button>
                <Button size="sm" onClick={handleSave} disabled={checkedCount === 0}
                  className="rounded-xl gradient-copper text-white hover:opacity-90 text-xs h-8 disabled:opacity-50">
                  Save {checkedCount > 0 ? `${checkedCount} item${checkedCount !== 1 ? "s" : ""}` : "Selected"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* SAVING STEP */}
        {step === "saving" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-8 h-8 text-copper animate-spin" />
            <p className="text-sm font-semibold text-sienna">Saving {checkedCount} item{checkedCount !== 1 ? "s" : ""}…</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
