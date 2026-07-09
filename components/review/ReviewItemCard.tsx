"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ExtractionMethodBadge, ConfidenceBadge } from "@/components/shared/StatusChip"
import type { ProgramRequirement, EssayRequirement } from "@/lib/supabase/types"

type Item = (ProgramRequirement | EssayRequirement) & {
  _table: "program_requirements" | "essay_requirements"
  _programName?: string
}

interface Props {
  item: Item
  onDismiss: (id: string) => void
}

export function ReviewItemCard({ item, onDismiss }: Props) {
  const [open, setOpen] = useState(false)
  const [sourceUrl, setSourceUrl] = useState(item.source_url ?? "")
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isEssay = item._table === "essay_requirements"
  const essay = isEssay ? (item as EssayRequirement) : null

  async function saveSourceUrl() {
    setSaving(true)
    const { error } = await supabase.from(item._table).update({ source_url: sourceUrl }).eq("id", item.id)
    setSaving(false)
    if (error) { toast.error("Failed to save source URL"); return }
    toast.success("Source URL saved")
    router.refresh()
  }

  async function markVerified() {
    setSaving(true)
    const { error } = await supabase.from(item._table).update({
      user_verified: true,
      confidence_score: 0.95,
      last_checked_at: new Date().toISOString(),
    }).eq("id", item.id)
    setSaving(false)
    if (error) { toast.error("Failed to mark verified"); return }
    toast.success("Marked as verified")
    router.refresh()
  }

  async function markPortalOnly() {
    if (!isEssay) return
    setSaving(true)
    const { error } = await supabase.from("essay_requirements").update({
      portal_only: true,
      source_type: "portal_only",
    }).eq("id", item.id)
    setSaving(false)
    if (error) { toast.error("Failed to update"); return }
    toast.success("Marked as portal-only")
    router.refresh()
  }

  async function markNA() {
    setSaving(true)
    const update = isEssay
      ? { status: "submitted" as const }
      : { status: "not_applicable" as const }
    const { error } = await supabase.from(item._table).update(update).eq("id", item.id)
    setSaving(false)
    if (error) { toast.error("Failed to update"); return }
    toast.success("Marked as N/A")
    router.refresh()
  }

  const title = isEssay
    ? (essay?.prompt_text?.slice(0, 80) ?? "(No prompt captured yet)")
    : (item as ProgramRequirement).title

  return (
    <div className="bg-card border border-sand/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-cream/40 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-rust truncate">{title}</p>
          <p className="text-xs text-sienna/60 mt-0.5">{item._programName ?? "Unknown Program"}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <ConfidenceBadge score={item.confidence_score} />
            <ExtractionMethodBadge method={item.extraction_method ?? null} />
            {essay?.portal_only && (
              <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 font-semibold">🔒 Portal Only</span>
            )}
          </div>
        </div>
        <span className="text-sienna/40 text-sm ml-3 flex-shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-sand/40 pt-3 space-y-3">
          {/* Source URL */}
          <div>
            <label className="text-xs font-bold text-sienna block mb-1">Source URL</label>
            <div className="flex gap-2">
              <input
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://admissions.university.edu/..."
                className="flex-1 text-xs border border-sand/60 rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
              />
              <button
                onClick={saveSourceUrl}
                disabled={saving || !sourceUrl}
                className="text-xs bg-copper text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-sienna disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={markVerified}
              disabled={saving}
              className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              ✓ Mark Verified
            </button>
            {isEssay && (
              <button
                onClick={markPortalOnly}
                disabled={saving}
                className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-violet-100 disabled:opacity-50 transition-colors"
              >
                🔒 Mark Portal-Only
              </button>
            )}
            <button
              onClick={markNA}
              disabled={saving}
              className="text-xs bg-sand/30 text-sienna border border-sand px-3 py-1.5 rounded-lg font-semibold hover:bg-sand/50 disabled:opacity-50 transition-colors"
            >
              N/A — Skip
            </button>
            <button
              onClick={() => onDismiss(item.id)}
              className="text-xs text-sienna/50 hover:text-sienna px-2 py-1.5 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export type { Item as ReviewItem }
