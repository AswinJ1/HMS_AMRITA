"use client"

import { useEffect, useState, useCallback } from "react"
import { format, isAfter, isBefore, startOfDay } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Loader2, ClipboardCheck, Clock, Eye } from "lucide-react"
import { toast } from "sonner"
import RoleGuard from "@/components/auth/role-guard"
import Pagination from "@/components/pagination"
import DashboardCharts from "@/components/dashboard-charts"
import { CLUBS } from "@/lib/clubs"

const PAGE_SIZE = 10

export default function HostelApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [comments, setComments] = useState("")
  const [clubFilter, setClubFilter] = useState("ALL")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [viewItem, setViewItem] = useState<any>(null)
  const [pendingPage, setPendingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)

  const fetchApprovals = useCallback(() => {
    setLoading(true)
    fetch("/api/approvals")
      .then((r) => r.json())
      .then((data) => setApprovals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchApprovals() }, [fetchApprovals])

  async function handleAction(requestId: string, status: "APPROVED" | "REJECTED") {
    setActing(true)
    try {
      const res = await fetch("/api/approvals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status, comments }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success(`Request ${status.toLowerCase()} successfully`)
      setSelected(null)
      setComments("")
      fetchApprovals()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActing(false)
    }
  }

  const filterByClub = (items: any[]) =>
    clubFilter === "ALL" ? items : items.filter((a) => a.request?.clubName === clubFilter)

  const filterByDate = (items: any[]) => {
    if (!fromDate && !toDate) return items
    return items.filter((a) => {
      if (!a.request?.date) return true
      const d = startOfDay(new Date(a.request.date))
      if (fromDate && isBefore(d, startOfDay(new Date(fromDate)))) return false
      if (toDate && isAfter(d, startOfDay(new Date(toDate)))) return false
      return true
    })
  }

  const applyFilters = (items: any[]) => filterByDate(filterByClub(items))

  const pending = applyFilters(
    approvals.filter((a) => a.status === "PENDING" && a.request?.stage === "WARDEN_PENDING")
  )
  const history = applyFilters(
    approvals.filter((a) => a.status !== "PENDING" || a.request?.stage !== "WARDEN_PENDING")
  )

  const pendingTotalPages = Math.ceil(pending.length / PAGE_SIZE)
  const paginatedPending = pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE)
  const historyTotalPages = Math.ceil(history.length / PAGE_SIZE)
  const paginatedHistory = history.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE)

  return (
    <RoleGuard allowedRoles={["HOSTEL"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Approvals</h1>
            <p className="text-sm text-muted-foreground">Final approval stage — review requests as Hostel Warden.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">From</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPendingPage(1); setHistoryPage(1) }}
                className="w-[145px] h-9 text-xs"
              />
              <span className="text-xs text-muted-foreground">To</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPendingPage(1); setHistoryPage(1) }}
                className="w-[145px] h-9 text-xs"
              />
            </div>
            <Select value={clubFilter} onValueChange={(v) => { setClubFilter(v); setPendingPage(1); setHistoryPage(1) }}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All clubs</SelectItem>
                {CLUBS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(fromDate || toDate) && (
              <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setFromDate(""); setToDate("") }}>Clear</Button>
            )}
          </div>
        </div>

        {/* Area Chart */}
        {/* <DashboardCharts compact /> */}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Review ({pending.length})</CardTitle>
            <CardDescription>Requests at Warden stage awaiting your action</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : pending.length === 0 ? (
              <div className="py-10 text-center">
                <ClipboardCheck className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Applicant</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Type</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Date</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPending.map((a) => {
                      const name = a.request?.student?.name || a.request?.teamLeadApplicant?.name || "—"
                      const type = a.request?.studentId ? "Student" : "Team Lead"
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm font-medium">{name}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{type}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.request?.clubName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.request?.date ? format(new Date(a.request.date), "dd MMM yyyy") : ""}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelected(a); setComments("") }}>
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <Pagination currentPage={pendingPage} totalPages={pendingTotalPages} onPageChange={setPendingPage} totalItems={pending.length} pageSize={PAGE_SIZE} />
              </>
            )}
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">History ({history.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Applicant</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Stage</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Decision</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHistory.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">{a.request?.student?.name || a.request?.teamLeadApplicant?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.request?.clubName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.request?.date ? format(new Date(a.request.date), "dd MMM yyyy") : ""}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{a.request?.stage}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"} className="text-[10px]">{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setViewItem(a)}>
                          <Eye className="mr-1 size-3.5" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination currentPage={historyPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} totalItems={history.length} pageSize={PAGE_SIZE} />
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review Request</DialogTitle>
              <DialogDescription>
                {selected?.request?.student?.name || selected?.request?.teamLeadApplicant?.name} — {selected?.request?.clubName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Date</p>
                  <p>{selected?.request?.date ? format(new Date(selected.request.date), "dd MMM yyyy") : ""}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Time</p>
                  <p>{selected?.request?.fromTime} – {selected?.request?.toTime}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Remarks</p>
                <p className="text-muted-foreground">{selected?.request?.remarks}</p>
              </div>
              {/* Prior approvals */}
              {selected?.request?.approvals && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Prior Approvals</p>
                  {selected.request.approvals
                    .filter((ap: any) => ap.teamLead || ap.staff)
                    .map((ap: any) => {
                      const n = ap.teamLead?.name || ap.staff?.name || "Unknown"
                      const r = ap.teamLead ? "TL" : "Staff"
                      return (
                        <div key={ap.id} className="mt-1 flex items-center justify-between border p-2">
                          <span className="text-xs">{n} ({r})</span>
                          <div className="text-right">
                            <Badge variant={ap.status === "APPROVED" ? "default" : "secondary"} className="text-[10px]">{ap.status}</Badge>
                            {ap.approvedAt && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                                <Clock className="size-2.5" />{format(new Date(ap.approvedAt), "dd MMM, HH:mm")}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
              {/* Security Status */}
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Security Status</p>
                <div className="mt-1 flex items-center justify-between border p-2">
                  <span className="text-xs">{selected?.request?.securityCheckedBy || "Security"}</span>
                  <div className="text-right">
                    <Badge
                      variant={
                        selected?.request?.securityStatus === "IN" ? "default"
                          : selected?.request?.securityStatus === "OUT" ? "secondary"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {selected?.request?.securityStatus || "NOT CHECKED"}
                    </Badge>
                    {selected?.request?.securityCheckedAt && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                        <Clock className="size-2.5" />{format(new Date(selected.request.securityCheckedAt), "dd MMM, HH:mm")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Comments (optional)</p>
                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Add comments..." rows={2} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="destructive" size="sm" disabled={acting} onClick={() => handleAction(selected.request.id, "REJECTED")}>
                {acting ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <XCircle className="mr-1 size-3.5" />} Reject
              </Button>
              <Button size="sm" disabled={acting} onClick={() => handleAction(selected.request.id, "APPROVED")}>
                {acting ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 size-3.5" />} Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View-only Dialog for history items */}
        <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                {viewItem?.request?.student?.name || viewItem?.request?.teamLeadApplicant?.name} — {viewItem?.request?.clubName}
              </DialogDescription>
            </DialogHeader>
            {viewItem && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Applicant</p>
                    <p className="font-medium">{viewItem.request?.student?.name || viewItem.request?.teamLeadApplicant?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Type</p>
                    <p>{viewItem.request?.studentId ? "Student" : "Team Lead"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Date</p>
                    <p>{viewItem.request?.date ? format(new Date(viewItem.request.date), "dd MMM yyyy") : ""}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Time</p>
                    <p>{viewItem.request?.fromTime} – {viewItem.request?.toTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Club</p>
                    <p className="font-medium">{viewItem.request?.clubName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Stage</p>
                    <Badge variant="outline" className="text-[10px]">{viewItem.request?.stage}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Remarks</p>
                  <p className="text-muted-foreground">{viewItem.request?.remarks}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Your Decision</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={viewItem.status === "APPROVED" ? "default" : viewItem.status === "REJECTED" ? "destructive" : "secondary"} className="text-[10px]">{viewItem.status}</Badge>
                    {viewItem.approvedAt && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-2.5" />{format(new Date(viewItem.approvedAt), "dd MMM yyyy, HH:mm")}
                      </span>
                    )}
                  </div>
                  {viewItem.comments && (
                    <p className="mt-1 text-xs text-muted-foreground italic border-l-2 border-muted pl-2">{viewItem.comments}</p>
                  )}
                </div>
                {/* Prior Approvals */}
                {viewItem.request?.approvals && viewItem.request.approvals.filter((ap: any) => ap.teamLead || ap.staff).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Prior Approvals</p>
                    {viewItem.request.approvals
                      .filter((ap: any) => ap.teamLead || ap.staff)
                      .map((ap: any) => {
                        const n = ap.teamLead?.name || ap.staff?.name || "Unknown"
                        const r = ap.teamLead ? "TL" : "Staff"
                        return (
                          <div key={ap.id} className="mt-1 flex items-center justify-between border p-2">
                            <span className="text-xs">{n} ({r})</span>
                            <div className="text-right">
                              <Badge variant={ap.status === "APPROVED" ? "default" : "secondary"} className="text-[10px]">{ap.status}</Badge>
                              {ap.approvedAt && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                                  <Clock className="size-2.5" />{format(new Date(ap.approvedAt), "dd MMM, HH:mm")}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
                {/* Security Status */}
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Security Status</p>
                  <div className="mt-1 flex items-center justify-between border p-2">
                    <span className="text-xs">{viewItem.request?.securityCheckedBy || "Security"}</span>
                    <div className="text-right">
                      <Badge
                        variant={viewItem.request?.securityStatus === "IN" ? "default" : viewItem.request?.securityStatus === "OUT" ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {viewItem.request?.securityStatus || "NOT CHECKED"}
                      </Badge>
                      {viewItem.request?.securityCheckedAt && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                          <Clock className="size-2.5" />{format(new Date(viewItem.request.securityCheckedAt), "dd MMM, HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
