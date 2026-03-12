"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardCheck, Send, FileText, Clock, CheckCircle2, ArrowRight } from "lucide-react"
import RoleGuard from "@/components/auth/role-guard"

export default function TeamLeadDashboard() {
  const { data: session } = useSession()
  const [approvals, setApprovals] = useState<any[]>([])
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/approvals").then((r) => r.json()),
      fetch("/api/stayback").then((r) => r.json()),
    ])
      .then(([a, r]) => {
        setApprovals(Array.isArray(a) ? a : [])
        setMyRequests(Array.isArray(r) ? r : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const pendingApprovals = approvals.filter(
    (a) => a.status === "PENDING" && a.request?.stage === "TEAM_LEAD_PENDING"
  ).length
  const totalApprovals = approvals.length
  const myPending = myRequests.filter((r) => !["COMPLETED", "REJECTED"].includes(r.stage)).length

  const stats = [
    { label: "Pending Reviews", value: pendingApprovals, icon: <ClipboardCheck className="size-4" />, desc: "Awaiting your action" },
    { label: "Total Assigned", value: totalApprovals, icon: <FileText className="size-4" />, desc: "All assigned approvals" },
    { label: "My Requests", value: myRequests.length, icon: <Send className="size-4" />, desc: "Your stayback requests" },
    { label: "My In Progress", value: myPending, icon: <Clock className="size-4" />, desc: "Your pending requests" },
  ]

  return (
    <RoleGuard allowedRoles={["TEAM_LEAD"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Team Lead Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {session?.user?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/team-lead/approvals"><ClipboardCheck className="mr-2 size-4" /> Approvals</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/team-lead/stayback"><Send className="mr-2 size-4" /> New Request</Link>
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

        {/* Pending approval items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Pending Approvals</CardTitle>
              <CardDescription>Student requests awaiting your review</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/team-lead/approvals">View All <ArrowRight className="ml-1 size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : pendingApprovals === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-2">
                {approvals
                  .filter((a) => a.status === "PENDING" && a.request?.stage === "TEAM_LEAD_PENDING")
                  .slice(0, 5)
                  .map((a) => (
                    <div key={a.id} className="flex items-center justify-between border p-3">
                      <div>
                        <p className="text-sm font-medium">{a.request?.student?.name || "Unknown"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {a.request?.clubName} · {a.request?.date ? format(new Date(a.request.date), "dd MMM") : ""}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
