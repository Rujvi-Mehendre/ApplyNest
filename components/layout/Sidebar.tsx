"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, GraduationCap, User, BookOpen, ClipboardList,
  Settings, LogOut, PenLine, ChevronRight, Layers, ClipboardCheck, BarChart3
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/programs", label: "Programs", icon: GraduationCap },
  { href: "/requirements", label: "Requirements", icon: ClipboardList },
  { href: "/essays", label: "Essays", icon: PenLine },
  { href: "/essays/similar", label: "Similar Prompts", icon: Layers },
  { href: "/review", label: "Review Queue", icon: ClipboardCheck },
  { href: "/workload", label: "Workload Planner", icon: BarChart3 },
  { href: "/profile", label: "My Profile", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-rust flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-copper flex items-center justify-center shadow-warm">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-cream text-xl tracking-tight">ApplyNest</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-cream/40 text-xs font-bold uppercase tracking-widest px-3 mb-3">Menu</p>
        {nav.map(({ href, label, icon: Icon }) => {
          // Active if exact match, OR starts with href/ AND no more-specific nav item also matches
          const active = pathname === href || (
            pathname.startsWith(href + "/") &&
            !nav.some(other => other.href !== href && other.href.startsWith(href) && pathname.startsWith(other.href))
          )
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                active
                  ? "bg-copper/80 text-cream shadow-sm"
                  : "text-cream/70 hover:text-cream hover:bg-white/10"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-cream" : "text-cream/60 group-hover:text-cream")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-cream/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
            pathname === "/settings" ? "bg-copper/80 text-cream" : "text-cream/70 hover:text-cream hover:bg-white/10"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-cream/70 hover:text-cream hover:bg-white/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
