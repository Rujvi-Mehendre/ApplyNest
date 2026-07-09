"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle, LayoutDashboard, PenTool, Star, Sparkles, GraduationCap } from "lucide-react"


const features = [
  { icon: LayoutDashboard, title: "Application Dashboard", desc: "See every program, deadline, and requirement at a glance — no more lost spreadsheets." },
  { icon: PenTool, title: "Essay Tracker", desc: "Track every prompt, draft, and revision. Group similar essays to write smarter." },
  { icon: CheckCircle, title: "Requirement Checklists", desc: "Never miss a transcript, test score, or recommendation. Mark items as you go." },
  { icon: Star, title: "AI Fit Scores", desc: "Get mock fit scores for each program based on your profile — real AI coming soon." },
  { icon: BookOpen, title: "Manual-First Design", desc: "Add exactly what you know. No black-box scraping. You stay in control." },
  { icon: Sparkles, title: "Portal-Only Prompts", desc: "Flag prompts that only appear after you start the app so nothing slips through." },
]

const steps = [
  { n: "1", title: "Build your profile", desc: "Enter your GPA, test scores, research, and skills once." },
  { n: "2", title: "Add your programs", desc: "Categorize schools as Reach, Target, or Safer." },
  { n: "3", title: "Track everything", desc: "Log requirements, essay prompts, and recommendation requests per school." },
  { n: "4", title: "Write & submit", desc: "Draft essays inline, track versions, and check off submissions." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Navbar */}
      <header className="border-b border-sand/50 bg-cream/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-copper flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-rust text-xl tracking-tight">ApplyNest</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sienna hover:text-rust hover:bg-sand/20 font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90">
                Get Started Free ✦
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-rust leading-tight mb-6">
          Your college apps,<br />
          <span className="text-copper">finally organized</span> ✦
        </h1>
        <p className="text-xl text-sienna/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          ApplyNest is a cozy, structured tracker for your college and grad school applications.
          Better than a spreadsheet. Built to grow with AI extraction later.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup">
            <Button size="lg" className="gradient-copper text-white border-0 rounded-2xl text-base font-bold px-8 shadow-warm-lg hover:opacity-90 h-12">
              Start Nesting 🐣
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="rounded-2xl text-base font-bold px-8 h-12 border-sand text-sienna hover:bg-sand/20">
              Sign in to your nest
            </Button>
          </Link>
        </div>

        {/* Hero visual */}
        <div className="mt-16 relative">
          <div className="bg-card rounded-3xl border border-sand/60 shadow-warm-lg p-6 max-w-4xl mx-auto text-left">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-sand/40">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-300" />
                <div className="w-3 h-3 rounded-full bg-amber-300" />
                <div className="w-3 h-3 rounded-full bg-green-300" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">ApplyNest Dashboard</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Programs", val: "8", color: "text-rust" },
                { label: "Essays Left", val: "12", color: "text-copper" },
                { label: "Reqs Pending", val: "24", color: "text-sienna" },
                { label: "Days to Next Deadline", val: "18", color: "text-olive" },
              ].map((s) => (
                <div key={s.label} className="bg-cream rounded-2xl p-3 border border-sand/40">
                  <div className={`text-2xl font-extrabold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { school: "MIT EECS", cat: "Reach", deadline: "Dec 15", status: "In Progress", pct: 40 },
                { school: "CMU MCDS", cat: "Reach", deadline: "Dec 1", status: "Planning", pct: 20 },
                { school: "UC Berkeley MIDS", cat: "Target", deadline: "Jan 5", status: "In Progress", pct: 65 },
              ].map((p) => (
                <div key={p.school} className="flex items-center gap-3 bg-cream/60 rounded-xl p-2.5 border border-sand/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-rust">{p.school}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.cat === "Reach" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{p.cat}</span>
                    </div>
                    <div className="mt-1.5 bg-sand/30 rounded-full h-1.5">
                      <div className="progress-bar-copper h-1.5 rounded-full" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-sienna">{p.deadline}</div>
                    <div className="text-xs text-muted-foreground">{p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card/50 border-y border-sand/40 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-rust text-center mb-2">Everything you need ✦</h2>
          <p className="text-sienna/70 text-center mb-12">Designed for serious applicants who want more than a Google Sheet.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card rounded-2xl border border-sand/50 p-6 shadow-warm card-hover">
                <div className="w-10 h-10 rounded-xl gradient-copper flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-rust text-lg mb-2">{f.title}</h3>
                <p className="text-sienna/70 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-rust mb-2">How it works 🐣</h2>
          <p className="text-sienna/70 mb-12">Four simple steps to an organized application season.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-4 text-left bg-card rounded-2xl border border-sand/50 p-5 shadow-warm">
                <div className="w-10 h-10 rounded-full gradient-copper flex items-center justify-center flex-shrink-0 text-white font-extrabold text-lg">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-bold text-rust mb-1">{s.title}</h3>
                  <p className="text-sienna/70 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-rust/5 border-t border-sand/40">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="text-4xl mb-4">🌸</div>
          <h2 className="text-3xl font-extrabold text-rust mb-4">Ready to build your nest?</h2>
          <p className="text-sienna/70 mb-8">Free to use during beta. No credit card required.</p>
          <Link href="/signup">
            <Button size="lg" className="gradient-copper text-white border-0 rounded-2xl text-base font-bold px-10 h-12 shadow-warm-lg hover:opacity-90">
              Create your account ✦
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand/40 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-lg gradient-copper flex items-center justify-center">
            <GraduationCap className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-rust">ApplyNest</span>
        </div>
        <p>Made with 🌸 for applicants everywhere</p>
      </footer>
    </div>
  )
}
