"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Activity, Shield, FileText, ArrowRight } from "lucide-react"
import RoleGuard from "@/components/auth/role-guard"
import DashboardCharts from "@/components/dashboard-charts"

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [logStats, setLogStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/logs").then((r) => r.json()),
    ])
      .then(([u, l]) => {
        setUsers(Array.isArray(u) ? u : [])
        setLogStats(l)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalUsers = users.length
  const staffCount = users.filter((u) => u.role === "STAFF").length
  const studentCount = users.filter((u) => u.role === "STUDENT" || u.role === "TEAM_LEAD").length
  const totalRequests = logStats?.requests?.length ?? 0

  const stats = [
    { label: "Total Users", value: totalUsers, icon: <Users className="size-4" />, desc: "All registered accounts" },
    { label: "Staff & Wardens", value: staffCount, icon: <Shield className="size-4" />, desc: "Staff + Security + Warden" },
    { label: "Students & TLs", value: studentCount, icon: <FileText className="size-4" />, desc: "Students and Team Leads" },
    { label: "Total Requests", value: totalRequests, icon: <Activity className="size-4" />, desc: "All stayback requests" },
  ]

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">System overview and management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/logs"><Activity className="mr-2 size-4" /> Logs</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/users"><Users className="mr-2 size-4" /> Manage Users</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) =>
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

        {/* Stage breakdown */}
        {logStats?.stats && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Request Stages</CardTitle>
                <CardDescription>Distribution by approval stage</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/logs">Full Logs <ArrowRight className="ml-1 size-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(logStats.stats).map(([stage, count]) => (
                  <div key={stage} className="border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {stage.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xl font-bold">{count as number}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Charts */}
        <DashboardCharts />
      </div>
    </RoleGuard>
  )
}
