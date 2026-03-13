"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Activity, Eye, Filter, Download, Clock } from "lucide-react"
import RoleGuard from "@/components/auth/role-guard"
import Pagination from "@/components/pagination"
import DashboardCharts from "@/components/dashboard-charts"
import { CLUBS } from "@/lib/clubs"

const stageBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  TEAM_LEAD_PENDING: { label: "TL Pending", variant: "secondary" },
  STAFF_PENDING: { label: "Staff Pending", variant: "secondary" },
  WARDEN_PENDING: { label: "Warden Pending", variant: "outline" },
  COMPLETED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
}

const PAGE_SIZE = 10

export default function AdminLogsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [clubFilter, setClubFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [selected, setSelected] = useState<any>(null)
  const [page, setPage] = useState(1)

  function fetchLogs(params?: Record<string, string>) {
    setLoading(true)
    const sp = new URLSearchParams()
    if (params) Object.entries(params).forEach(([k, v]) => v && sp.set(k, v))
    fetch(`/api/logs?${sp.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs() }, [])

  function applyFilters() {
    const params: Record<string, string> = {}
    if (stageFilter && stageFilter !== "ALL") params.stage = stageFilter
    if (statusFilter && statusFilter !== "ALL") params.status = statusFilter
    if (clubFilter && clubFilter !== "ALL") params.clubName = clubFilter
    setPage(1)
    fetchLogs(params)
  }

  function handleExport() {
    const sp = new URLSearchParams()
    if (stageFilter && stageFilter !== "ALL") sp.set("stage", stageFilter)
    if (statusFilter && statusFilter !== "ALL") sp.set("status", statusFilter)
    if (clubFilter && clubFilter !== "ALL") sp.set("club", clubFilter)
    if (fromDate) sp.set("startDate", fromDate)
    if (toDate) sp.set("endDate", toDate)
    window.open(`/api/export/stayback?${sp.toString()}`, "_blank")
  }

  const requests = data?.requests || []
  const stats = data?.stats || {}

  const totalPages = Math.ceil(requests.length / PAGE_SIZE)
  const paginatedRequests = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">System Logs</h1>
            <p className="text-sm text-muted-foreground">Complete audit trail of all stayback requests.</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
        </div>

        {/* Stage stats */}
        {Object.keys(stats).length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(stats).map(([stage, count]) => (
              <div key={stage} className="border bg-card p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {stage.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-xl font-bold">{count as number}</p>
              </div>
            ))}
          </div>
        )}

        {/* Area Chart */}
        <DashboardCharts compact />

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</Label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="All stages" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All stages</SelectItem>
                  <SelectItem value="TEAM_LEAD_PENDING">TL Pending</SelectItem>
                  <SelectItem value="STAFF_PENDING">Staff Pending</SelectItem>
                  <SelectItem value="WARDEN_PENDING">Warden Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Club</Label>
              <Select value={clubFilter} onValueChange={setClubFilter}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="All clubs" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All clubs</SelectItem>
                  {CLUBS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[145px] h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[145px] h-9 text-xs" />
            </div>
            <Button size="sm" onClick={applyFilters}>
              <Filter className="mr-2 size-3.5" /> Apply
            </Button>
          </CardContent>
        </Card>

        {/* Requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Requests ({requests.length})</CardTitle>
            <CardDescription>All stayback requests in the system</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : requests.length === 0 ? (
              <div className="py-10 text-center">
                <Activity className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No requests found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Applicant</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Date</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Stage</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Security</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map((req: any) => {
                      const name = req.student?.name || req.teamLeadApplicant?.name || "Unknown"
                      const badge = stageBadge[req.stage] || { label: req.stage, variant: "outline" as const }
                      return (
                        <TableRow key={req.id}>
                          <TableCell className="text-sm font-medium">{name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{req.clubName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(req.date), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={badge.variant} className="text-[10px] font-semibold">{badge.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant={req.securityStatus === "IN" ? "default" : req.securityStatus === "OUT" ? "secondary" : "outline"} className="text-[10px]">
                                {req.securityStatus || "—"}
                              </Badge>
                              {req.securityCheckedAt && (
                                <p className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="size-2.5" />
                                  {format(new Date(req.securityCheckedAt), "dd MMM, HH:mm")}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelected(req)}>
                              <Eye className="mr-1 size-3.5" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={requests.length}
                  pageSize={PAGE_SIZE}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Request Detail</DialogTitle>
              <DialogDescription>#{selected?.id?.slice(0, 8)}</DialogDescription>
            </DialogHeader>
            {selected && (() => {
              const name = selected.student?.name || selected.teamLeadApplicant?.name || "Unknown"
              const badge = stageBadge[selected.stage] || { label: selected.stage, variant: "outline" as const }
              return (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Applicant</p><p className="font-medium">{name}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Club</p><p className="font-medium">{selected.clubName}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Date</p><p>{format(new Date(selected.date), "dd MMM yyyy")}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Time</p><p>{selected.fromTime} – {selected.toTime}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Stage</p><Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge></div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Security</p>
                      <div>
                        <span>{selected.securityStatus || "Not checked"}</span>
                        {selected.securityCheckedAt && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="size-2.5" />
                            {format(new Date(selected.securityCheckedAt), "dd MMM, HH:mm")}
                            {selected.securityCheckedBy && ` · ${selected.securityCheckedBy}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Remarks</p>
                    <p className="text-muted-foreground">{selected.remarks}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Approval Chain</p>
                    <div className="space-y-1.5">
                      {selected.approvals?.map((a: any) => {
                        const n = a.teamLead?.name || a.staff?.name || a.hostel?.name || "Unknown"
                        const r = a.teamLead ? "Team Lead" : a.staff ? "Staff" : "Warden"
                        return (
                          <div key={a.id} className="flex items-center justify-between border p-2">
                            <div>
                              <span className="text-xs font-medium">{n}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">({r})</span>
                            </div>
                            <div className="text-right">
                              <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"} className="text-[10px]">{a.status}</Badge>
                              {a.approvedAt && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(a.approvedAt), "dd MMM, HH:mm")}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
