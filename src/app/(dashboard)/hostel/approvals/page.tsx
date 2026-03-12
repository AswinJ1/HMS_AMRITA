"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Loader2, ClipboardCheck } from "lucide-react"
import { toast } from "sonner"
import RoleGuard from "@/components/auth/role-guard"

export default function HostelApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [comments, setComments] = useState("")

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

  const pending = approvals.filter((a) => a.status === "PENDING" && a.request?.stage === "WARDEN_PENDING")
  const history = approvals.filter((a) => a.status !== "PENDING" || a.request?.stage !== "WARDEN_PENDING")

  return (
    <RoleGuard allowedRoles={["HOSTEL"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Approvals</h1>
          <p className="text-sm text-muted-foreground">Final approval stage — review requests as Hostel Warden.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Review ({pending.length})</CardTitle>
            <CardDescription>Requests at Warden stage awaiting your action</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : pending.length === 0 ? (
              <div className="py-10 text-center">
                <ClipboardCheck className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No pending requests</p>
              </div>
            ) : (
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
                  {pending.map((a) => {
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
            )}
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Applicant</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Stage</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.slice(0, 10).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">{a.request?.student?.name || a.request?.teamLeadApplicant?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.request?.clubName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{a.request?.stage}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"} className="text-[10px]">{a.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                          <Badge variant={ap.status === "APPROVED" ? "default" : "secondary"} className="text-[10px]">{ap.status}</Badge>
                        </div>
                      )
                    })}
                </div>
              )}
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
      </div>
    </RoleGuard>
  )
}
