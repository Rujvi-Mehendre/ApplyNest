import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "No deadline"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function deadlineUrgency(date: string | Date | null | undefined): "overdue" | "urgent" | "soon" | "upcoming" | "none" {
  const days = daysUntil(date)
  if (days === null) return "none"
  if (days < 0) return "overdue"
  if (days <= 7) return "urgent"
  if (days <= 21) return "soon"
  return "upcoming"
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export const CATEGORY_COLORS = {
  Reach: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Target: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Safer: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
} as const

export const ESSAY_STATUS_CONFIG = {
  not_started: { label: "Not Started", emoji: "○", color: "bg-gray-100 text-gray-600" },
  outline: { label: "Outline", emoji: "✏️", color: "bg-blue-50 text-blue-700" },
  draft_1: { label: "Draft 1", emoji: "📝", color: "bg-amber-50 text-amber-700" },
  revised: { label: "Revised", emoji: "🔄", color: "bg-purple-50 text-purple-700" },
  final: { label: "Final", emoji: "⭐", color: "bg-copper-50 text-copper" },
  submitted: { label: "Submitted", emoji: "✅", color: "bg-green-50 text-green-700" },
} as const

export const REQ_STATUS_CONFIG = {
  not_started: { label: "Not Started", emoji: "○", color: "bg-gray-100 text-gray-600" },
  needed: { label: "Needed", emoji: "📋", color: "bg-red-50 text-red-700" },
  requested: { label: "Requested", emoji: "📨", color: "bg-blue-50 text-blue-700" },
  uploaded: { label: "Uploaded", emoji: "📤", color: "bg-amber-50 text-amber-700" },
  verified: { label: "Verified", emoji: "✓", color: "bg-teal-50 text-teal-700" },
  submitted: { label: "Submitted", emoji: "✅", color: "bg-green-50 text-green-700" },
  waived: { label: "Waived", emoji: "–", color: "bg-gray-100 text-gray-500" },
  not_applicable: { label: "N/A", emoji: "N/A", color: "bg-gray-50 text-gray-400" },
} as const
