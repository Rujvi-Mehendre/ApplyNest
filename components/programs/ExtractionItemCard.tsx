"use client"
import { useState } from "react"
import { ConfidenceBadge } from "@/components/shared/StatusChip"
import type { RequirementItem, EssayItem } from "@/lib/ai/extraction-schemas"

type Item = RequirementItem | EssayItem

interface Props {
  item: Item
  checked: boolean
  onToggle: () => void
  onChange: (updated: Item) => void
  sourceType: string
}

const REQ_TYPE_LABELS: Record<RequirementItem["requirement_type"], string> = {
  transcript: "Transcript",
  test_score: "Test Score",
  lor: "Letter of Rec",
  sop: "SOP",
  resume: "Resume / CV",
  portfolio: "Portfolio",
  other: "Other",
}

const ESSAY_TYPE_LABELS: Record<EssayItem["essay_type"], string> = {
  sop: "Statement of Purpose",
  personal_statement: "Personal Statement",
  diversity: "Diversity Essay",
  why_school: "Why This School",
  short_answer: "Short Answer",
  other: "Other Essay",
}

export function ExtractionItemCard({ item, checked, onToggle, onChange, sourceType }: Props) {
  const [excerptOpen, setExcerptOpen] = useState(false)
  const isEssay = item.item_type === "essay"
  const essay = isEssay ? (item as EssayItem) : null
  const req = !isEssay ? (item as RequirementItem) : null

  const typeLabel = isEssay
    ? ESSAY_TYPE_LABELS[essay!.essay_type]
    : REQ_TYPE_LABELS[req!.requirement_type]

  const lowConf = item.confidence_score < 0.5

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-colors ${checked ? "border-copper/40 bg-cream/40" : "border-sand/40 bg-card"} ${lowConf ? "border-amber-200" : ""}`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded border-sand accent-copper flex-shrink-0 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          {/* Editable title */}
          <input
            value={item.title}
            onChange={e => onChange({ ...item, title: e.target.value } as Item)}
            className="w-full text-sm font-semibold text-rust bg-transparent border-b border-transparent hover:border-sand/60 focus:border-copper focus:outline-none pb-0.5"
          />
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs bg-sand/30 text-sienna rounded-full px-2 py-0.5 font-semibold capitalize">
              {typeLabel}
            </span>
            <ConfidenceBadge score={item.confidence_score} />
            {isEssay && essay!.portal_only && (
              <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 font-semibold">🔒 Portal Only</span>
            )}
          </div>
        </div>
      </div>

      {/* Low confidence warning */}
      {lowConf && (
        <div className="ml-7 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          ⚠️ Low confidence — verify this item on the official program website before saving.
          {item.extraction_notes && <span className="block mt-0.5 text-amber-700">{item.extraction_notes}</span>}
        </div>
      )}
      {!lowConf && item.extraction_notes && (
        <p className="ml-7 text-xs text-sienna/60 italic">{item.extraction_notes}</p>
      )}

      {/* Essay prompt text */}
      {isEssay && (
        <div className="ml-7">
          <label className="text-xs font-bold text-sienna block mb-1">
            Prompt text {essay!.portal_only ? "(portal only — will be blank)" : ""}
          </label>
          <textarea
            value={essay!.exact_prompt ?? ""}
            onChange={e => onChange({ ...essay!, exact_prompt: e.target.value || null } as Item)}
            placeholder={essay!.portal_only ? "Prompt only visible in application portal" : "No prompt text extracted — add manually if known"}
            rows={3}
            disabled={essay!.portal_only}
            className="w-full text-xs border border-sand/60 rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-copper resize-none disabled:opacity-50"
          />
        </div>
      )}

      {/* Editable fields */}
      <div className="ml-7 grid grid-cols-2 md:grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-bold text-sienna block mb-1">Deadline</label>
          <input
            type="date"
            value={item.deadline ?? ""}
            onChange={e => onChange({ ...item, deadline: e.target.value || null } as Item)}
            className="w-full text-xs border border-sand/60 rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
          />
        </div>
        {isEssay && essay!.word_limit !== undefined && (
          <div>
            <label className="text-xs font-bold text-sienna block mb-1">Word Limit</label>
            <input
              type="number"
              value={essay!.word_limit ?? ""}
              onChange={e => onChange({ ...essay!, word_limit: e.target.value ? parseInt(e.target.value) : null } as Item)}
              placeholder="—"
              className="w-full text-xs border border-sand/60 rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
            />
          </div>
        )}
        {!isEssay && (
          <div>
            <label className="text-xs font-bold text-sienna block mb-1">Required</label>
            <select
              value={req!.is_required ? "yes" : "no"}
              onChange={e => onChange({ ...req!, is_required: e.target.value === "yes" } as Item)}
              className="w-full text-xs border border-sand/60 rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-copper"
            >
              <option value="yes">Required</option>
              <option value="no">Optional</option>
            </select>
          </div>
        )}
      </div>

      {/* Source excerpt (collapsible) */}
      {item.source_excerpt && (
        <div className="ml-7">
          <button
            onClick={() => setExcerptOpen(o => !o)}
            className="text-xs font-semibold text-copper hover:text-sienna transition-colors"
          >
            {excerptOpen ? "▲ Hide source" : "▼ Source excerpt"}
          </button>
          {excerptOpen && (
            <blockquote className="mt-1.5 border-l-2 border-copper/40 pl-3 text-xs text-sienna/70 italic leading-relaxed">
              "{item.source_excerpt}"
            </blockquote>
          )}
        </div>
      )}
    </div>
  )
}
