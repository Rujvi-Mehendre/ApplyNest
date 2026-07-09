import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  accent?: "copper" | "rust" | "olive" | "sand"
  trend?: { value: number; label: string }
}

export function StatCard({ label, value, sub, icon: Icon, accent = "copper" }: StatCardProps) {
  const accentCls = {
    copper: "text-copper bg-copper/10",
    rust: "text-rust bg-rust/10",
    olive: "text-olive bg-olive/10",
    sand: "text-sienna bg-sand/30",
  }[accent]

  return (
    <div className="bg-card rounded-2xl border border-sand/60 p-5 shadow-warm card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", accentCls)}>
          <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-rust leading-none mb-1">{value}</div>
      <div className="text-sm font-semibold text-sienna/80">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  )
}
