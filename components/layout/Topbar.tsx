"use client"
import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface TopbarProps {
  userName?: string
  userEmail?: string
}

export function Topbar({ userName, userEmail }: TopbarProps) {
  const initials = userName
    ? userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "AN"

  return (
    <header className="h-16 border-b border-sand/60 bg-cream/80 backdrop-blur sticky top-0 z-30 flex items-center px-6 gap-4">
      <div className="flex-1 flex items-center gap-3 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search programs, essays…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-sand/60 bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="rounded-xl text-sienna hover:bg-sand/20">
          <Bell className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2.5 pl-2 border-l border-sand/60">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="gradient-copper text-white text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-rust leading-tight">{userName || "Applicant"}</p>
            <p className="text-xs text-muted-foreground leading-tight">{userEmail || ""}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
