"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Eye, FileText, Clock, CheckCircle2, XCircle, Shield, ArrowRight } from "lucide-react"
import Pagination from "@/components/pagination"

const stageBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  TEAM_LEAD_PENDING: { label: "TL Pending", variant: "secondary" },
  STAFF_PENDING: { label: "Staff Pending", variant: "secondary" },
  WARDEN_PENDING: { label: "Warden Pending", variant: "outline" },
  COMPLETED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
}

interface Approval {
  id: string
  status: string
  comments?: string | null
  approvedAt?: string | null
  teamLead?: { name: string; clubName?: string } | null
  staff?: { name: string; department?: string } | null
  hostel?: { name: string; hostelName?: string } | null
}

interface StaybackRequest {
  id: string
  clubName: string
  date: string
  fromTime: string
  toTime: string
  remarks: string
  status: string
  stage: string
  createdAt: string
  securityStatus?: string | null
  securityCheckedAt?: string | null
  securityCheckedBy?: string | null
  approvals: Approval[]
}

const PAGE_SIZE = 10

export default function RequestsTable({ requests }: { requests: StaybackRequest[] }) {
  const [selected, setSelected] = useState<StaybackRequest | null>(null)
  const [page, setPage] = useState(1)

  if (!requests.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">No requests found</p>
          <p className="text-xs text-muted-foreground/60">Submit a stayback request to see it here.</p>
        </CardContent>
      </Card>
    )
  }

  const totalPages = Math.ceil(requests.length / PAGE_SIZE)
  const paginatedRequests = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">My Requests</CardTitle>
          <CardDescription>{requests.length} total request{requests.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Time</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Stage</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((req) => {
                const badge = stageBadge[req.stage] || { label: req.stage, variant: "outline" as const }
                return (
                  <TableRow key={req.id} className="group">
                    <TableCell className="text-sm font-medium">{req.clubName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(req.date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.fromTime} – {req.toTime}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="text-[10px] font-semibold">
                        {badge.label}
                      </Badge>
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
        </CardContent>
      </Card>

      {/* Redesigned Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (() => {
            const badge = stageBadge[selected.stage] || { label: selected.stage, variant: "outline" as const }
            return (
              <>
                {/* Header with gradient accent */}
                <div className="rounded-t-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent -mx-6 -mt-6 px-6 pt-6 pb-4 mb-2">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-lg">Request Details</DialogTitle>
                      <Badge variant={badge.variant} className="text-[10px] font-semibold">{badge.label}</Badge>
                    </div>
                    <DialogDescription className="font-mono text-xs">#{selected.id.slice(0, 8)}</DialogDescription>
                  </DialogHeader>
                </div>

                <div className="space-y-4">
                  {/* Request Info Section */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <FileText className="size-3" /> Request Information
                    </p>
                    <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-md border">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Club / Team</p>
                        <p className="text-sm font-medium">{selected.clubName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Date</p>
                        <p className="text-sm font-medium">{format(new Date(selected.date), "dd MMM yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Time Window</p>
                        <p className="text-sm font-medium">{selected.fromTime} – {selected.toTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Submitted</p>
                        <p className="text-sm font-medium">{format(new Date(selected.createdAt), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Remarks Section */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Remarks</p>
                    <div className="border-l-2 border-primary/30 pl-3 py-1">
                      <p className="text-sm text-muted-foreground italic">{selected.remarks}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Approval Timeline */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                      <ArrowRight className="size-3" /> Approval Timeline
                    </p>
                    <div className="space-y-0">
                      {selected.approvals.map((a, index) => {
                        const name = a.teamLead?.name || a.staff?.name || a.hostel?.name || "Unknown"
                        const roleLabel = a.teamLead ? "Team Lead" : a.staff ? "Staff" : "Warden"
                        const isApproved = a.status === "APPROVED"
                        const isRejected = a.status === "REJECTED"
                        const isPending = a.status === "PENDING"

                        return (
                          <div key={a.id} className="flex gap-3">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                              <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${isApproved ? "bg-green-500/20 text-green-600" :
                                  isRejected ? "bg-red-500/20 text-red-600" :
                                    "bg-muted text-muted-foreground"
                                }`}>
                                {isApproved ? <CheckCircle2 className="size-3.5" /> :
                                  isRejected ? <XCircle className="size-3.5" /> :
                                    <Clock className="size-3.5" />}
                              </div>
                              {index < selected.approvals.length - 1 && (
                                <div className={`w-px flex-1 min-h-[20px] ${isApproved ? "bg-green-500/30" : "bg-border"}`} />
                              )}
                            </div>

                            {/* Content */}
                            <div className="pb-3 flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{name}</p>
                                  <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
                                </div>
                                <Badge
                                  variant={isApproved ? "default" : isRejected ? "destructive" : "secondary"}
                                  className="text-[10px]"
                                >
                                  {a.status}
                                </Badge>
                              </div>
                              {a.approvedAt && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock className="size-2.5" />
                                  {format(new Date(a.approvedAt), "dd MMM yyyy, HH:mm")}
                                </p>
                              )}
                              {a.comments && (
                                <p className="text-xs text-muted-foreground mt-1 border-l-2 border-muted pl-2 italic">
                                  {a.comments}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Security Status */}
                  {(selected.securityStatus || selected.stage === "COMPLETED") && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Shield className="size-3" /> Security Check
                        </p>
                        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md border">
                          <div>
                            <p className="text-sm font-medium">
                              {selected.securityStatus === "IN" ? "Checked In" :
                                selected.securityStatus === "OUT" ? "Checked Out" : "Not Checked Yet"}
                            </p>
                            {selected.securityCheckedAt && (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="size-2.5" />
                                {format(new Date(selected.securityCheckedAt), "dd MMM yyyy, HH:mm")}
                                {selected.securityCheckedBy && ` · by ${selected.securityCheckedBy}`}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={selected.securityStatus === "IN" ? "default" : selected.securityStatus === "OUT" ? "secondary" : "outline"}
                            className="text-[10px] font-semibold"
                          >
                            {selected.securityStatus || "PENDING"}
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}
