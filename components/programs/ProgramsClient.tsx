"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CategoryBadge } from "@/components/shared/StatusChip"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { formatDate, daysUntil, deadlineUrgency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { ExportMenu } from "@/components/shared/ExportMenu"
import type { SavedProgram, Program } from "@/lib/supabase/types"
import {
  Plus, LayoutGrid, List, ExternalLink, Settings2, Trash2,
  ArrowUpDown, Search, SlidersHorizontal, X
} from "lucide-react"

type SP = SavedProgram & { program: Program }

const CATEGORIES = ["Reach", "Target", "Safer"] as const
const STATUSES = ["planning", "in_progress", "submitted", "accepted", "rejected", "withdrawn"] as const
const DEGREE_TYPES = [
  "BA", "BS", "BFA", "BEng", "BArch", "BBA", "BSN", "BEd",
  "MS", "MA", "MBA", "MFA", "MEng", "MPH", "MPS", "MPA", "MPP", "MHA", "MSW", "MArch",
  "PhD", "JD", "LLM", "MD", "DPT", "DNP", "EdD",
  "Certificate", "Post-Bacc", "Other",
] as const

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning", in_progress: "In Progress", submitted: "Submitted",
  accepted: "Accepted", rejected: "Rejected", withdrawn: "Withdrawn",
}

type SortKey = "deadline" | "university" | "category" | "status"

interface Props { programs: SP[] }

export function ProgramsClient({ programs: initial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [view, setView] = useState<"table" | "card">("table")
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterDegree, setFilterDegree] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>("deadline")
  const [sortAsc, setSortAsc] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [programs, setPrograms] = useState(initial)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const filtered = useMemo(() => {
    let list = programs.filter(sp => {
      const q = search.toLowerCase()
      const match = !q || sp.program?.university?.toLowerCase().includes(q) || sp.program?.name?.toLowerCase().includes(q) || sp.program?.location?.toLowerCase().includes(q)
      const cat = !filterCat.length || filterCat.includes(sp.category)
      const status = !filterStatus.length || filterStatus.includes(sp.status)
      const degree = !filterDegree.length || filterDegree.includes(sp.program?.degree_type ?? "")
      return match && cat && status && degree
    })
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "deadline") {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity
        cmp = da - db
      } else if (sortKey === "university") {
        cmp = (a.program?.university ?? "").localeCompare(b.program?.university ?? "")
      } else if (sortKey === "category") {
        const order = { Reach: 0, Target: 1, Safer: 2 }
        cmp = (order[a.category as keyof typeof order] ?? 3) - (order[b.category as keyof typeof order] ?? 3)
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status)
      }
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [programs, search, filterCat, filterStatus, filterDegree, sortKey, sortAsc])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from("saved_programs").delete().eq("id", deleteId)
    setDeleting(false)
    setDeleteId(null)
    if (error) { toast.error("Failed to remove program"); return }
    setPrograms(p => p.filter(x => x.id !== deleteId))
    toast.success("Program removed")
  }

  const activeFilters = filterCat.length + filterStatus.length + filterDegree.length

  function SortTh({ label, col }: { label: string; col: SortKey }) {
    const active = sortKey === col
    return (
      <th className="text-left py-3 px-4 text-xs font-bold text-sienna/60 uppercase tracking-wide">
        <button onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:text-sienna transition-colors">
          {label}
          <ArrowUpDown className={`w-3 h-3 ${active ? "text-copper" : "opacity-30"}`} />
        </button>
      </th>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="My Programs"
        description={`${programs.length} program${programs.length !== 1 ? "s" : ""} in your nest`}
        icon="🎓"
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu programs={programs} variant="programs" />
            <Link href="/programs/new">
              <Button className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90">
                <Plus className="w-4 h-4 mr-1.5" /> Add Program
              </Button>
            </Link>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…"
            className="pl-8 h-9 rounded-xl border-sand bg-card text-sm" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}
          className={`rounded-xl border-sand text-sienna h-9 text-xs font-semibold ${showFilters ? "bg-sand/20" : ""}`}>
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
          Filters {activeFilters > 0 && <span className="ml-1 bg-copper text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{activeFilters}</span>}
        </Button>
        <div className="flex border border-sand/60 rounded-xl overflow-hidden">
          <button onClick={() => setView("table")} className={`px-3 h-9 text-xs font-semibold transition-colors ${view === "table" ? "bg-copper text-white" : "bg-card text-sienna hover:bg-sand/20"}`}>
            <List className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setView("card")} className={`px-3 h-9 text-xs font-semibold transition-colors ${view === "card" ? "bg-copper text-white" : "bg-card text-sienna hover:bg-sand/20"}`}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-card border border-sand/60 rounded-2xl p-4 mb-4 shadow-warm">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-bold text-sienna mb-2 uppercase tracking-wide">Category</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setFilterCat(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])}
                    className={`text-xs px-3 py-1 rounded-full font-semibold border transition-all ${filterCat.includes(c) ? "gradient-copper text-white border-transparent" : "border-sand text-sienna hover:bg-sand/20"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-sienna mb-2 uppercase tracking-wide">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setFilterStatus(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                    className={`text-xs px-3 py-1 rounded-full font-semibold border transition-all capitalize ${filterStatus.includes(s) ? "gradient-copper text-white border-transparent" : "border-sand text-sienna hover:bg-sand/20"}`}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-sienna mb-2 uppercase tracking-wide">Degree Type</p>
              <div className="flex flex-wrap gap-1.5">
                {DEGREE_TYPES.map(d => (
                  <button key={d} onClick={() => setFilterDegree(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])}
                    className={`text-xs px-3 py-1 rounded-full font-semibold border transition-all ${filterDegree.includes(d) ? "gradient-copper text-white border-transparent" : "border-sand text-sienna hover:bg-sand/20"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterCat([]); setFilterStatus([]); setFilterDegree([]) }}
              className="mt-3 text-xs text-copper font-semibold hover:text-sienna flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {programs.length === 0 ? (
        <div className="bg-card rounded-3xl border border-sand/60 shadow-warm pb-12">
          <EmptyState icon="🐣" title="No programs yet" description="Add your first school to start building your application list." />
          <div className="text-center">
            <Link href="/programs/new">
              <Button className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90">
                <Plus className="w-4 h-4 mr-1.5" /> Add your first program
              </Button>
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-sand/60 shadow-warm">
          <EmptyState icon="🔍" title="No matches" description="Try adjusting your search or filters." />
        </div>
      ) : view === "table" ? (
        <div className="bg-card rounded-2xl border border-sand/60 shadow-warm overflow-hidden">
          <div className="px-5 py-3 border-b border-sand/40 bg-cream/40 text-xs text-muted-foreground font-semibold">
            Showing {filtered.length} of {programs.length} programs
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand/40 bg-cream/20">
                  <SortTh label="Program" col="university" />
                  <th className="text-left py-3 px-4 text-xs font-bold text-sienna/60 uppercase tracking-wide">Type</th>
                  <SortTh label="Category" col="category" />
                  <SortTh label="Deadline" col="deadline" />
                  <SortTh label="Status" col="status" />
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((sp, i) => {
                  const urgency = deadlineUrgency(sp.deadline)
                  const days = daysUntil(sp.deadline)
                  return (
                    <tr key={sp.id} className={`border-b border-sand/20 hover:bg-cream/60 transition-colors ${i % 2 === 1 ? "bg-cream/20" : ""}`}>
                      <td className="py-3 px-4">
                        <Link href={`/programs/${sp.id}`} className="block group">
                          <p className="font-bold text-rust group-hover:text-copper transition-colors text-xs">{sp.program?.university}</p>
                          <p className="text-xs text-muted-foreground">{sp.program?.name}</p>
                          {sp.program?.location && <p className="text-[11px] text-muted-foreground/70">{sp.program.location}</p>}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-sand/30 text-sienna px-2 py-0.5 rounded-full font-semibold">{sp.program?.degree_type}</span>
                      </td>
                      <td className="py-3 px-4"><CategoryBadge category={sp.category} /></td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium text-sienna">{formatDate(sp.deadline)}</p>
                        {days !== null && !["submitted","accepted","rejected","withdrawn"].includes(sp.status?.toLowerCase()) && (
                          <p className={`text-xs font-bold ${urgency === "urgent" || urgency === "overdue" ? "text-red-600" : urgency === "soon" ? "text-amber-600" : "text-muted-foreground"}`}>
                            {days < 0 ? "Overdue!" : days === 0 ? "Due today!" : `${days}d left`}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                          sp.status === "accepted" ? "bg-green-50 text-green-700 border border-green-200" :
                          sp.status === "rejected" ? "bg-red-50 text-red-700 border border-red-200" :
                          sp.status === "submitted" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-sand/30 text-sienna"}`}>
                          {STATUS_LABEL[sp.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/programs/${sp.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs rounded-lg text-sienna hover:text-rust hover:bg-sand/20">View</Button>
                          </Link>
                          <Link href={`/programs/${sp.id}/edit`}>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-sienna hover:text-rust hover:bg-sand/20">
                              <Settings2 className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          {sp.program?.website && (
                            <a href={sp.program.website} target="_blank" rel="noopener noreferrer">
                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-sienna hover:text-rust hover:bg-sand/20">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(sp.id)}
                            className="h-7 w-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(sp => {
            const urgency = deadlineUrgency(sp.deadline)
            const days = daysUntil(sp.deadline)
            return (
              <div key={sp.id} className="bg-card rounded-2xl border border-sand/60 shadow-warm card-hover p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <CategoryBadge category={sp.category} />
                  <div className="flex gap-1">
                    <Link href={`/programs/${sp.id}/edit`}>
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg text-sienna hover:bg-sand/20">
                        <Settings2 className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(sp.id)}
                      className="h-6 w-6 rounded-lg text-red-400 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Link href={`/programs/${sp.id}`} className="flex-1 group">
                  <h3 className="font-extrabold text-rust group-hover:text-copper transition-colors text-sm leading-tight">{sp.program?.university}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{sp.program?.name}</p>
                  {sp.program?.location && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sp.program.location}</p>}
                </Link>
                <div className="mt-4 pt-3 border-t border-sand/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-sienna">{formatDate(sp.deadline)}</p>
                    {days !== null && !["submitted","accepted","rejected","withdrawn"].includes(sp.status?.toLowerCase()) && (
                      <p className={`text-[11px] font-bold ${urgency === "urgent" || urgency === "overdue" ? "text-red-600" : urgency === "soon" ? "text-amber-600" : "text-muted-foreground"}`}>
                        {days < 0 ? "Overdue!" : days === 0 ? "Due today!" : `${days}d left`}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                    sp.status === "accepted" ? "bg-green-50 text-green-700" :
                    sp.status === "rejected" ? "bg-red-50 text-red-700" :
                    sp.status === "submitted" ? "bg-blue-50 text-blue-700" :
                    "bg-sand/30 text-sienna"}`}>
                    {STATUS_LABEL[sp.status]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        title="Remove this program?"
        description="This will also delete all requirements, essays, and notes for this program. This cannot be undone."
        confirmLabel="Remove"
        danger
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
