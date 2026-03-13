"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Loader2, ClipboardCheck, Clock } from "lucide-react"
import { toast } from "sonner"
import RoleGuard from "@/components/auth/role-guard"
import Pagination from "@/components/pagination"
import { CLUBS } from "@/lib/clubs"

const PAGE_SIZE = 10

export default function TeamLeadApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [comments, setComments] = useState("")
  const [clubFilter, setClubFilter] = useState("ALL")
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

  const pending = filterByClub(
    approvals.filter((a) => a.status === "PENDING" && a.request?.stage === "TEAM_LEAD_PENDING")
  )
  const history = filterByClub(
    approvals.filter((a) => a.status !== "PENDING" || a.request?.stage !== "TEAM_LEAD_PENDING")
  )

  const pendingTotalPages = Math.ceil(pending.length / PAGE_SIZE)
  const paginatedPending = pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE)
  const historyTotalPages = Math.ceil(history.length / PAGE_SIZE)
  const paginatedHistory = history.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE)

  return (
    <RoleGuard allowedRoles={["TEAM_LEAD"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Approvals</h1>
            <p className="text-sm text-muted-foreground">Review and act on student stayback requests.</p>
          </div>
          {/* <div className="flex items-center gap-2">
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
          </div> */}
        </div>

        {/* Pending */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Review ({pending.length})</CardTitle>
            <CardDescription>These requests require your action</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : pending.length === 0 ? (
              <div className="py-10 text-center">
                <ClipboardCheck className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">All caught up</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Student</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Date</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Time</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPending.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm font-medium">{a.request?.student?.name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.request?.clubName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.request?.date ? format(new Date(a.request.date), "dd MMM yyyy") : ""}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.request?.fromTime} – {a.request?.toTime}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelected(a); setComments("") }}>
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination currentPage={pendingPage} totalPages={pendingTotalPages} onPageChange={setPendingPage} totalItems={pending.length} pageSize={PAGE_SIZE} />
              </>
            )}
          </CardContent>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">History ({history.length})</CardTitle>
              <CardDescription>Previously reviewed requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Student</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Stage</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Your Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHistory.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">{a.request?.student?.name || a.request?.teamLeadApplicant?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.request?.clubName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{a.request?.stage}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"} className="text-[10px]">
                          {a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination currentPage={historyPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} totalItems={history.length} pageSize={PAGE_SIZE} />
            </CardContent>
          </Card>
        )}

        {/* Review dialog */}
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review Request</DialogTitle>
              <DialogDescription>
                {selected?.request?.student?.name} — {selected?.request?.clubName}
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
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Your Comments (optional)</p>
                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Add review comments..." rows={2} />
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
      </div>
    </RoleGuard>
  )
}
