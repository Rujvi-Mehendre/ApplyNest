"use client"
import { useState } from "react"
import type { PromptGroup } from "@/lib/providers"

interface Props {
  groups: PromptGroup[]
  drafts: Record<string, string>
  spMap: Record<string, string>
  totalEssays: number
}

const THEME_COLORS: Record<string, string> = {
  why_school: "bg-copper/10 text-copper border-copper/20",
  sop: "bg-olive/10 text-olive border-olive/20",
  personal_statement: "bg-rust/10 text-rust border-rust/20",
  diversity: "bg-violet-50 text-violet-700 border-violet-200",
  research: "bg-blue-50 text-blue-700 border-blue-200",
  leadership: "bg-amber-50 text-amber-700 border-amber-200",
  short_answer: "bg-gray-50 text-gray-600 border-gray-200",
}

function PromptGroupCard({ group, draft, spMap }: { group: PromptGroup; draft?: string; spMap: Record<string, string> }) {
  const [showDraft, setShowDraft] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const colorCls = THEME_COLORS[group.theme_key] ?? "bg-sand/30 text-sienna border-sand"

  const programs = [...new Set(group.programs)].map(id => spMap[id]).filter(Boolean)

  return (
    <div className="bg-card border border-sand/60 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-rust text-base">{group.group_name}</h3>
            <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${colorCls}`}>
              {group.theme_key.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-sienna/60">
            {group.essay_ids.length} essay{group.essay_ids.length !== 1 ? "s" : ""} · {programs.length} program{programs.length !== 1 ? "s" : ""}
            · {Math.round(group.similarity_score * 100)}% reuse potential
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-cream border-2 border-sand flex items-center justify-center">
            <span className="text-sm font-extrabold text-copper">{Math.round(group.similarity_score * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Programs */}
      {programs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {programs.map(name => (
            <span key={name} className="text-xs bg-sand/30 text-sienna rounded-full px-2.5 py-0.5 font-semibold">
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Adaptation notes */}
      <div className="bg-cream rounded-xl border border-sand/40 p-3">
        <p className="text-xs font-bold text-sienna mb-1">How to customize per school</p>
        <p className="text-xs text-sienna/80 leading-relaxed">{group.adaptation_notes}</p>
      </div>

      {/* Toggle prompts */}
      {group.prompts.length > 0 && (
        <div>
          <button
            onClick={() => setShowPrompts(o => !o)}
            className="text-xs font-semibold text-copper hover:text-sienna transition-colors"
          >
            {showPrompts ? "▲ Hide prompts" : `▼ View ${group.prompts.length} prompt${group.prompts.length !== 1 ? "s" : ""}`}
          </button>
          {showPrompts && (
            <div className="mt-2 space-y-2">
              {group.prompts.map((p, i) => (
                <div key={i} className="text-xs bg-white border border-sand/40 rounded-lg p-2.5 text-sienna/80 leading-relaxed italic">
                  "{p}"
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Draft template */}
      {draft && (
        <div>
          <button
            onClick={() => setShowDraft(o => !o)}
            className="text-xs font-semibold text-olive hover:text-sienna transition-colors"
          >
            {showDraft ? "▲ Hide suggested template" : "▼ View suggested reusable draft template"}
          </button>
          {showDraft && (
            <pre className="mt-2 text-xs text-sienna/80 bg-olive/5 border border-olive/20 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
              {draft}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export function SimilarPromptsClient({ groups, drafts, spMap, totalEssays }: Props) {
  if (totalEssays === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">✍️</div>
        <h2 className="text-lg font-bold text-rust mb-1">No essays yet</h2>
        <p className="text-sienna/60 text-sm">Add essay requirements to your programs to see prompt groups here.</p>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-lg font-bold text-rust mb-1">No groups found</h2>
        <p className="text-sienna/60 text-sm">Your essays don't match any known prompt groups yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <PromptGroupCard
          key={group.theme_key}
          group={group}
          draft={drafts[group.theme_key]}
          spMap={spMap}
        />
      ))}
    </div>
  )
}
