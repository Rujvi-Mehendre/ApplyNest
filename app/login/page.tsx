"use client"
export const dynamic = "force-dynamic"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { GraduationCap, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl gradient-copper flex items-center justify-center shadow-warm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-rust text-2xl">ApplyNest</span>
          </div>
          <p className="text-sienna/70 text-sm">Welcome back to your nest 🌸</p>
        </div>

        <div className="bg-card rounded-3xl border border-sand/60 shadow-warm-lg p-8">
          <h1 className="text-2xl font-extrabold text-rust mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">Continue your application journey</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sienna font-semibold text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="rounded-xl border-sand focus:border-copper focus:ring-copper/20 bg-cream"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sienna font-semibold text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="rounded-xl border-sand focus:border-copper focus:ring-copper/20 bg-cream"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm border border-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-copper text-white border-0 rounded-xl font-bold h-11 shadow-warm hover:opacity-90"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in ✦"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-copper font-bold hover:text-sienna transition-colors">
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
