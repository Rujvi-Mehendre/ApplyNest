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

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from("applicant_profiles").upsert({
        user_id: data.user.id,
        full_name: name,
        email: email,
        skills: [],
      })
      router.push("/dashboard")
      router.refresh()
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl border border-sand/60 shadow-warm-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🌸</div>
          <h2 className="text-2xl font-extrabold text-rust mb-2">Check your email!</h2>
          <p className="text-sienna/70">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          <Link href="/login" className="mt-6 inline-block text-copper font-bold hover:text-sienna">
            Back to sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl gradient-copper flex items-center justify-center shadow-warm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-rust text-2xl">ApplyNest</span>
          </div>
          <p className="text-sienna/70 text-sm">Build your application nest 🐣</p>
        </div>

        <div className="bg-card rounded-3xl border border-sand/60 shadow-warm-lg p-8">
          <h1 className="text-2xl font-extrabold text-rust mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground mb-6">Free during beta · No credit card needed</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sienna font-semibold text-sm">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="rounded-xl border-sand focus:border-copper bg-cream"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sienna font-semibold text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="rounded-xl border-sand focus:border-copper bg-cream"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sienna font-semibold text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="rounded-xl border-sand focus:border-copper bg-cream"
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create my nest ✦"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-copper font-bold hover:text-sienna transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
