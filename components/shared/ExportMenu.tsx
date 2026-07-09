"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { exportProgramsCsv, exportEssaysCsv, exportRequirementsCsv, downloadFile } from "@/lib/export"
import { Download, ChevronDown } from "lucide-react"
import type { SavedProgram, Program, ProgramRequirement, EssayRequirement } from "@/lib/supabase/types"

interface Props {
  programs?: (SavedProgram & { program?: Program })[]
  requirements?: ProgramRequirement[]
  essays?: EssayRequirement[]
  variant?: "programs" | "requirements" | "essays" | "all"
}

export function ExportMenu({ programs = [], requirements = [], essays = [], variant = "all" }: Props) {
  const [open, setOpen] = useState(false)

  function handleExport(type: "programs" | "requirements" | "essays") {
    setOpen(false)
    if (type === "programs") {
      const csv = exportProgramsCsv(programs)
      downloadFile(csv, "applynest-programs.csv")
    } else if (type === "requirements") {
      const csv = exportRequirementsCsv(requirements, programs)
      downloadFile(csv, "applynest-requirements.csv")
    } else if (type === "essays") {
      const csv = exportEssaysCsv(essays, programs)
      downloadFile(csv, "applynest-essays.csv")
    }
  }

  const items = variant === "programs"
    ? [{ key: "programs" as const, label: "Programs (CSV)" }]
    : variant === "requirements"
    ? [{ key: "requirements" as const, label: "Requirements (CSV)" }]
    : variant === "essays"
    ? [{ key: "essays" as const, label: "Essays (CSV)" }]
    : [
        { key: "programs" as const, label: "Programs (CSV)" },
        { key: "requirements" as const, label: "Requirements (CSV)" },
        { key: "essays" as const, label: "Essays (CSV)" },
      ]

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(v => !v)}
        className="rounded-xl border-sand text-sienna h-9 text-xs font-semibold hover:bg-sand/20">
        <Download className="w-3.5 h-3.5 mr-1.5" /> Export <ChevronDown className="w-3 h-3 ml-1" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-sand/60 rounded-xl shadow-warm overflow-hidden min-w-[180px]">
            {items.map(item => (
              <button key={item.key} onClick={() => handleExport(item.key)}
                className="w-full text-left px-4 py-2.5 text-xs text-sienna font-semibold hover:bg-cream/80 transition-colors flex items-center gap-2">
                <Download className="w-3 h-3 text-copper" /> {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
