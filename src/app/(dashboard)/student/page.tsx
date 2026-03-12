"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Send, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import RoleGuard from "@/components/auth/role-guard"
import { format } from "date-fns"

interface Request {
  id: string; clubName: string; date: string; stage: string; createdAt: string
}

const stageMeta: Record<string, { label: string; color: string }> = {
  TEAM_LEAD_PENDING: { label: "TL Review", color: "text-yellow-600" },
  STAFF_PENDING: { label: "Staff Review", color: "text-blue-600" },
  WARDEN_PENDING: { label: "Warden Review", color: "text-purple-600" },
  COMPLETED: { label: "Approved", color: "text-green-600" },
  REJECTED: { label: "Rejected", color: "text-red-600" },
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/stayback")
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const pending = requests.filter((r) => !["COMPLETED", "REJECTED"].includes(r.stage)).length
  const approved = requests.filter((r) => r.stage === "COMPLETED").length
  const rejected = requests.filter((r) => r.stage === "REJECTED").length

  const stats = [
    { label: "Total Requests", value: requests.length, icon: <FileText className="size-4" />, desc: "All submitted requests" },
    { label: "In Progress", value: pending, icon: <Clock className="size-4" />, desc: "Awaiting approval" },
    { label: "Approved", value: approved, icon: <CheckCircle2 className="size-4" />, desc: "Fully approved" },
    { label: "Rejected", value: rejected, icon: <XCircle className="size-4" />, desc: "Denied requests" },
  ]

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {session?.user?.name || "Student"}
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/student/stayback">
              <Send className="mr-2 size-4" /> New Request
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) =>
            loading ? (
              <Skeleton key={s.label} className="h-24" />
            ) : (
              <Card key={s.label}>
                <CardContent className="flex items-start justify-between p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-2xl font-bold">{s.value}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{s.desc}</p>
                  </div>
                  <div className="flex size-9 items-center justify-center bg-primary/10 text-primary">
                    {s.icon}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recent Requests</CardTitle>
              <CardDescription>Your latest stayback submissions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/requests">View All <ArrowRight className="ml-1 size-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No requests yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.slice(0, 5).map((req) => {
                  const meta = stageMeta[req.stage] || { label: req.stage, color: "" }
                  return (
                    <div key={req.id} className="flex items-center justify-between border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center bg-muted text-[10px] font-bold text-muted-foreground">
                          {req.clubName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{req.clubName}</p>
                          <p className="text-[11px] text-muted-foreground">{format(new Date(req.date), "dd MMM yyyy")}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] font-semibold ${meta.color}`}>
                        {meta.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
