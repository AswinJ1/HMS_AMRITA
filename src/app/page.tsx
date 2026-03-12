import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Shield, ClipboardCheck, Users, Activity, ArrowRight, CheckCircle2 } from "lucide-react"

const features = [
  {
    icon: <ClipboardCheck className="size-5" />,
    title: "Cascading Approvals",
    desc: "Sequential multi-level approval from Team Lead through Staff to Warden.",
  },
  {
    icon: <Shield className="size-5" />,
    title: "Security Monitoring",
    desc: "Real-time check-in and check-out tracking at the gate.",
  },
  {
    icon: <Users className="size-5" />,
    title: "Role-Based Access",
    desc: "Six distinct roles with granular permissions and dashboards.",
  },
  {
    icon: <Activity className="size-5" />,
    title: "Audit Logs",
    desc: "Complete approval history and activity tracking for administrators.",
  },
]

const steps = [
  { step: "01", title: "Student Submits", desc: "Student or Team Lead creates a stayback request." },
  { step: "02", title: "Cascading Approval", desc: "Request moves through Team Lead → Staff → Warden." },
  { step: "03", title: "Security Check", desc: "Approved students are verified at the gate." },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <span className="text-sm font-bold tracking-tight">HMS Amrita</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4 text-[10px] font-semibold uppercase tracking-widest">
              Hostel Management System
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Streamline Hostel Stayback
              <span className="text-primary"> Approvals</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Cascading multi-level approval workflow — from student request to security gate — in one unified platform.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Create Account <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Sign in to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Platform</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Built for Efficiency</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="border bg-card p-5">
                <div className="flex size-9 items-center justify-center bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Workflow</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">How It Works</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <span className="text-4xl font-black text-primary/15">{s.step}</span>
                <h3 className="mt-2 text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="mb-10 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Roles</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Six Dedicated Portals</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Student", "Team Lead", "Staff", "Hostel Warden", "Security", "Admin"].map((r) => (
              <div key={r} className="flex items-center gap-3 border bg-card p-4">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                <span className="text-sm font-medium">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-card/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">HMS Amrita</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
