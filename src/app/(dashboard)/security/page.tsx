"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, Users, LogIn, LogOut, Activity, ArrowRight } from "lucide-react"
import RoleGuard from "@/components/auth/role-guard"

export default function SecurityDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/security/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: "Active Requests", value: stats?.totalActive ?? 0, icon: <Users className="size-4" />, desc: "Approved for entry" },
    { label: "Checked In", value: stats?.markedIn ?? 0, icon: <LogIn className="size-4" />, desc: "Currently inside" },
    { label: "Checked Out", value: stats?.markedOut ?? 0, icon: <LogOut className="size-4" />, desc: "Left premises" },
    { label: "Today's Checks", value: stats?.todayChecks ?? 0, icon: <Activity className="size-4" />, desc: "Verified today" },
  ]

  return (
    <RoleGuard allowedRoles={["SECURITY"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Security Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {stats?.securityName || session?.user?.name}</p>
          </div>
          <Button size="sm" asChild>
            <Link href="/security/monitoring"><Shield className="mr-2 size-4" /> Gate Monitoring</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((s) =>
            loading ? <Skeleton key={s.label} className="h-24" /> : (
              <Card key={s.label}>
                <CardContent className="flex items-start justify-between p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-2xl font-bold">{s.value}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{s.desc}</p>
                  </div>
                  <div className="flex size-9 items-center justify-center bg-primary/10 text-primary">{s.icon}</div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Gate Activity</CardTitle>
              <CardDescription>Quick overview of monitoring status</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/security/monitoring">Full View <ArrowRight className="ml-1 size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 rounded-none border p-4">
              <Shield className="size-8 text-primary/40" />
              <div>
                <p className="text-sm font-medium">Security Checkpoint Active</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.department || "Campus Security"} — {(stats?.totalActive ?? 0) - (stats?.markedIn ?? 0) - (stats?.markedOut ?? 0)} pending verification
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
