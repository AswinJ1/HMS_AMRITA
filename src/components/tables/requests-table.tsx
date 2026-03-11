"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Eye, FileText } from "lucide-react"

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
  approvals: Approval[]
}

export default function RequestsTable({ requests }: { requests: StaybackRequest[] }) {
  const [selected, setSelected] = useState<StaybackRequest | null>(null)

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
              {requests.map((req) => {
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelected(req)}>
                            <Eye className="mr-1 size-3.5" /> View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Request Details</DialogTitle>
                            <DialogDescription>#{req.id.slice(0, 8)}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Club</p>
                                <p className="font-medium">{req.clubName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Date</p>
                                <p className="font-medium">{format(new Date(req.date), "dd MMM yyyy")}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Time</p>
                                <p className="font-medium">{req.fromTime} – {req.toTime}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Stage</p>
                                <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Remarks</p>
                              <p className="text-muted-foreground">{req.remarks}</p>
                            </div>
                            <Separator />
                            <div>
                              <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Approval Chain</p>
                              <div className="space-y-2">
                                {req.approvals.map((a) => {
                                  const name = a.teamLead?.name || a.staff?.name || a.hostel?.name || "Unknown"
                                  const roleLabel = a.teamLead ? "Team Lead" : a.staff ? "Staff" : "Warden"
                                  return (
                                    <div key={a.id} className="flex items-center justify-between border p-2">
                                      <div>
                                        <p className="text-xs font-medium">{name}</p>
                                        <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
                                      </div>
                                      <Badge
                                        variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"}
                                        className="text-[10px]"
                                      >
                                        {a.status}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
