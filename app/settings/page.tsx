"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/shared/PageHeader"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Download, LogOut, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Manage your account and preferences." icon="⚙️" />

      <div className="space-y-5">
        {/* Notifications */}
        <section className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Notifications</h2>
          <div className="space-y-4">
            {[
              { id: "deadline-reminders", label: "Deadline Reminders", desc: "Get reminded 7 days before program deadlines" },
              { id: "weekly-summary", label: "Weekly Summary", desc: "Receive a weekly progress summary" },
              { id: "essay-reminders", label: "Essay Reminders", desc: "Reminders for essays not yet started" },
            ].map(({ id, label, desc }) => (
              <div key={id} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={id} className="text-sm font-semibold text-sienna cursor-pointer">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch id={id} />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">Notification delivery coming soon ✦</p>
        </section>

        {/* Export */}
        <section className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Export Data</h2>
          <p className="text-sm text-sienna/80 mb-4">Download all your application data as a CSV or JSON file.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl border-sand text-sienna hover:bg-sand/20 text-sm" disabled>
              <Download className="w-4 h-4 mr-2" /> Export as CSV
            </Button>
            <Button variant="outline" className="rounded-xl border-sand text-sienna hover:bg-sand/20 text-sm" disabled>
              <Download className="w-4 h-4 mr-2" /> Export as JSON
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">Export coming soon ✦</p>
        </section>

        {/* Account */}
        <section className="bg-card rounded-2xl border border-sand/60 shadow-warm p-5">
          <h2 className="font-bold text-rust mb-4">Account</h2>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full justify-start rounded-xl border-sand text-sienna hover:bg-sand/20 font-semibold"
            >
              {signingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
              Sign out
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-semibold"
              disabled
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete account
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">Account deletion coming soon ✦</p>
        </section>

        {/* About */}
        <section className="bg-card rounded-2xl border border-sand/60 p-5 text-center">
          <div className="text-2xl mb-2">🐣</div>
          <p className="font-bold text-rust">ApplyNest</p>
          <p className="text-xs text-muted-foreground">MVP v0.1 · Manual-first · AI-ready</p>
          <p className="text-xs text-muted-foreground mt-1">Made with 🌸 for applicants everywhere</p>
        </section>
      </div>
    </div>
  )
}
