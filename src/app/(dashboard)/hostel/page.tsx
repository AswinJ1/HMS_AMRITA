"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardCheck, FileText, Clock, CheckCircle2, ArrowRight } from "lucide-react"
import RoleGuard from "@/components/auth/role-guard"
import DashboardCharts from "@/components/dashboard-charts"
import { format } from "date-fns"

export default function HostelDashboard() {
  const { data: session } = useSession()
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/approvals")
      .then((r) => r.json())
      .then((data) => setApprovals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const pending = approvals.filter((a) => a.status === "PENDING" && a.request?.stage === "WARDEN_PENDING").length
  const approved = approvals.filter((a) => a.status === "APPROVED").length
  const rejected = approvals.filter((a) => a.status === "REJECTED").length

  const stats = [
    { label: "Pending Reviews", value: pending, icon: <Clock className="size-4" />, desc: "Awaiting your action" },
    { label: "Total Assigned", value: approvals.length, icon: <FileText className="size-4" />, desc: "All assigned requests" },
    { label: "Approved", value: approved, icon: <CheckCircle2 className="size-4" />, desc: "Requests you approved" },
    { label: "Rejected", value: rejected, icon: <ClipboardCheck className="size-4" />, desc: "Requests you rejected" },
  ]

  return (
    <RoleGuard allowedRoles={["HOSTEL"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Hostel Warden Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {session?.user?.name}</p>
          </div>
          <Button size="sm" asChild>
            <Link href="/hostel/approvals"><ClipboardCheck className="mr-2 size-4" /> Review Approvals</Link>
          </Button>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Pending Approvals</CardTitle>
              <CardDescription>Requests at Warden stage</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/hostel/approvals">View All <ArrowRight className="ml-1 size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : pending === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-2">
                {approvals
                  .filter((a) => a.status === "PENDING" && a.request?.stage === "WARDEN_PENDING")
                  .slice(0, 5)
                  .map((a) => {
                    const name = a.request?.student?.name || a.request?.teamLeadApplicant?.name || "Unknown"
                    return (
                      <div key={a.id} className="flex items-center justify-between border p-3">
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {a.request?.clubName} · {a.request?.date ? format(new Date(a.request.date), "dd MMM") : ""}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Charts */}
        <DashboardCharts compact />
      </div>
    </RoleGuard>
  )
}
