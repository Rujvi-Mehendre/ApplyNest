"use client"
import { useState } from "react"
import { ReviewItemCard, type ReviewItem } from "./ReviewItemCard"
import type { ProgramRequirement, EssayRequirement } from "@/lib/supabase/types"

type AnyItem = ProgramRequirement | EssayRequirement

interface Props {
  missingPrompts: EssayRequirement[]
  lowConfidence: AnyItem[]
  portalOnly: EssayRequirement[]
  noSource: AnyItem[]
  stale: AnyItem[]
  spMap: Record<string, { university: string; name: string }>
}

function toReviewItems(
  items: AnyItem[],
  table: "program_requirements" | "essay_requirements",
  spMap: Record<string, { university: string; name: string }>
): ReviewItem[] {
  return items.map(item => ({
    ...item,
    _table: table,
    _programName: spMap[item.saved_program_id]
      ? `${spMap[item.saved_program_id].university} — ${spMap[item.saved_program_id].name}`
      : undefined,
  }))
}

interface GroupProps {
  emoji: string
  label: string
  items: ReviewItem[]
  dismissed: Set<string>
  onDismiss: (id: string) => void
}

function ReviewGroup({ emoji, label, items, dismissed, onDismiss }: GroupProps) {
  const [open, setOpen] = useState(true)
  const visible = items.filter(i => !dismissed.has(i.id))
  if (visible.length === 0) return null

  return (
    <section>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between mb-3 text-left"
      >
        <h2 className="text-sm font-bold text-rust flex items-center gap-2">
          <span>{emoji}</span>
          <span>{label}</span>
          <span className="bg-sand/40 text-sienna text-xs rounded-full px-2 py-0.5 font-bold">{visible.length}</span>
        </h2>
        <span className="text-sienna/40 text-xs">{open ? "▲ Collapse" : "▼ Expand"}</span>
      </button>

      {open && (
        <div className="space-y-2">
          {visible.map(item => (
            <ReviewItemCard key={item.id} item={item} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </section>
  )
}

export function ReviewQueueClient({ missingPrompts, lowConfidence, portalOnly, noSource, stale, spMap }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const dismiss = (id: string) => setDismissed(prev => new Set([...prev, id]))

  const isEssay = (item: AnyItem): item is EssayRequirement => "essay_type" in item
  const isReq = (item: AnyItem): item is ProgramRequirement => "requirement_type" in item

  return (
    <div className="space-y-8">
      <ReviewGroup
        emoji="🔴"
        label="Missing Prompts"
        items={toReviewItems(missingPrompts, "essay_requirements", spMap)}
        dismissed={dismissed}
        onDismiss={dismiss}
      />
      <ReviewGroup
        emoji="⚠️"
        label="Low Confidence"
        items={[
          ...toReviewItems(lowConfidence.filter(isReq), "program_requirements", spMap),
          ...toReviewItems(lowConfidence.filter(isEssay), "essay_requirements", spMap),
        ]}
        dismissed={dismissed}
        onDismiss={dismiss}
      />
      <ReviewGroup
        emoji="🔒"
        label="Portal Only — Prompt Not Captured"
        items={toReviewItems(portalOnly, "essay_requirements", spMap)}
        dismissed={dismissed}
        onDismiss={dismiss}
      />
      <ReviewGroup
        emoji="❓"
        label="No Source"
        items={[
          ...toReviewItems(noSource.filter(isReq), "program_requirements", spMap),
          ...toReviewItems(noSource.filter(isEssay), "essay_requirements", spMap),
        ]}
        dismissed={dismissed}
        onDismiss={dismiss}
      />
      <ReviewGroup
        emoji="🕐"
        label="Needs Re-check (30+ days old)"
        items={[
          ...toReviewItems(stale.filter(isReq), "program_requirements", spMap),
          ...toReviewItems(stale.filter(isEssay), "essay_requirements", spMap),
        ]}
        dismissed={dismissed}
        onDismiss={dismiss}
      />
    </div>
  )
}
