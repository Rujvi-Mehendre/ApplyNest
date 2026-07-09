import { cn } from "@/lib/utils"
import { ESSAY_STATUS_CONFIG, REQ_STATUS_CONFIG } from "@/lib/utils"

type EssayStatus = keyof typeof ESSAY_STATUS_CONFIG
type ReqStatus = keyof typeof REQ_STATUS_CONFIG

interface EssayStatusChipProps {
  status: EssayStatus
  size?: "sm" | "md"
}

interface ReqStatusChipProps {
  status: ReqStatus
  size?: "sm" | "md"
}

export function EssayStatusChip({ status, size = "md" }: EssayStatusChipProps) {
  const config = ESSAY_STATUS_CONFIG[status] ?? ESSAY_STATUS_CONFIG.not_started
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1",
      config.color
    )}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  )
}

export function ReqStatusChip({ status, size = "md" }: ReqStatusChipProps) {
  const config = REQ_STATUS_CONFIG[status] ?? REQ_STATUS_CONFIG.not_started
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1",
      config.color
    )}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  )
}

export function CategoryBadge({ category }: { category: "Reach" | "Target" | "Safer" }) {
  const cfg = {
    Reach: "bg-red-50 text-red-700 border border-red-200",
    Target: "bg-amber-50 text-amber-700 border border-amber-200",
    Safer: "bg-green-50 text-green-700 border border-green-200",
  }[category]

  return (
    <span className={cn("inline-flex items-center rounded-full text-xs font-bold px-2.5 py-0.5", cfg)}>
      {category === "Reach" ? "🎯" : category === "Target" ? "⭐" : "🛡️"} {category}
    </span>
  )
}

export function SourceBadge({ type }: { type: "official" | "user_entered" | "portal_only" | "scraped" | "portal_entered" | "unknown" }) {
  const cfg = {
    official: { label: "Official Source", cls: "bg-olive/10 text-olive border border-olive/20" },
    user_entered: { label: "User Entered", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
    portal_only: { label: "Portal Only", cls: "bg-purple-50 text-purple-700 border border-purple-200" },
    scraped: { label: "Auto-detected", cls: "bg-sand/30 text-sienna border border-sand" },
    portal_entered: { label: "Portal Entered", cls: "bg-violet-50 text-violet-700 border border-violet-200" },
    unknown: { label: "Unknown Source", cls: "bg-gray-50 text-gray-500 border border-gray-200" },
  }[type] ?? { label: type, cls: "bg-gray-50 text-gray-500 border border-gray-200" }

  return (
    <span className={cn("inline-flex items-center rounded-full text-xs font-semibold px-2 py-0.5", cfg.cls)}>
      {cfg.label}
    </span>
  )
}

export function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.90) return (
    <span className="inline-flex items-center rounded-full text-xs font-semibold px-2 py-0.5 bg-green-50 text-green-700 border border-green-200">
      ✓ Verified
    </span>
  )
  if (score >= 0.75) return (
    <span className="inline-flex items-center rounded-full text-xs font-semibold px-2 py-0.5 bg-olive/10 text-olive border border-olive/20">
      ✓ Official (indirect)
    </span>
  )
  if (score >= 0.50) return (
    <span className="inline-flex items-center rounded-full text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
      ⚠️ Unverified
    </span>
  )
  if (score >= 0.25) return (
    <span className="inline-flex items-center rounded-full text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200">
      ~ Inferred
    </span>
  )
  return (
    <span className="inline-flex items-center rounded-full text-xs font-semibold px-2 py-0.5 bg-red-50 text-red-700 border border-red-200">
      ? Unknown
    </span>
  )
}

export function ExtractionMethodBadge({ method }: { method: string | null }) {
  if (!method) return null
  const cfg: Record<string, { label: string; cls: string }> = {
    portal_entered: { label: "🔒 Portal Entered", cls: "bg-violet-50 text-violet-700 border border-violet-200" },
    ai_extracted:   { label: "⚡ AI Extracted",   cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    manual:         { label: "✏️ Manual",          cls: "bg-gray-50 text-gray-600 border border-gray-200" },
    url_scrape:     { label: "🌐 Auto-detected",   cls: "bg-blue-50 text-blue-700 border border-blue-200" },
    imported:       { label: "↑ Imported",         cls: "bg-sand/30 text-sienna border border-sand" },
  }
  const c = cfg[method]
  if (!c) return null
  return (
    <span className={cn("inline-flex items-center rounded-full text-xs font-semibold px-2 py-0.5", c.cls)}>
      {c.label}
    </span>
  )
}
