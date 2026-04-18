"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LogIn, LogOut, Shield, Loader2, Clock } from "lucide-react"
import { toast } from "sonner"
import RoleGuard from "@/components/auth/role-guard"
import Pagination from "@/components/pagination"

const PAGE_SIZE = 10

export default function SecurityMonitoringPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch("/api/security")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function markStatus(requestId: string, status: "IN" | "OUT") {
    setActingId(requestId)
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success(`Marked as ${status}`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActingId(null)
    }
  }

  const requests = data?.requests || []
  const totalPages = Math.ceil(requests.length / PAGE_SIZE)
  const paginatedRequests = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <RoleGuard allowedRoles={["SECURITY"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Gate Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Mark check-in / check-out for approved stayback requests.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Requests ({requests.length})</CardTitle>
            <CardDescription>Requests at Warden Pending or Completed stage</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : requests.length === 0 ? (
              <div className="py-10 text-center">
                <Shield className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No active requests</p>
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
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Time</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map((req: any) => {
                      const secBadge = req.securityStatus === "IN"
                        ? { label: "Inside", variant: "default" as const }
                        : req.securityStatus === "OUT"
                          ? { label: "Left", variant: "secondary" as const }
                          : { label: "Pending", variant: "outline" as const }

                      return (
                        <TableRow key={req.id}>
                          <TableCell className="text-sm font-medium">{req.applicantName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {req.applicantType === "student" ? "Student" : "Team Lead"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{req.clubName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(req.date), "dd MMM")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{req.fromTime} – {req.toTime}</TableCell>
                          <TableCell>
                            <div>
                              <Badge variant={secBadge.variant} className="text-[10px] font-semibold">{secBadge.label}</Badge>
                              {req.securityCheckedAt && (
                                <p className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="size-2.5" />
                                  {format(new Date(req.securityCheckedAt), "dd MMM, HH:mm")}
                                </p>
                              )}
                              {/* {req.securityCheckedBy && (
                                <p className="text-[10px] text-muted-foreground">by {req.securityCheckedBy}</p>
                              )} */}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={actingId === req.id}
                                onClick={() => markStatus(req.id, "IN")}
                              >
                                {actingId === req.id ? <Loader2 className="size-3 animate-spin" /> : <LogIn className="mr-1 size-3" />}
                                IN
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={actingId === req.id}
                                onClick={() => markStatus(req.id, "OUT")}
                              >
                                {actingId === req.id ? <Loader2 className="size-3 animate-spin" /> : <LogOut className="mr-1 size-3" />}
                                OUT
                              </Button>
                            </div>
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
      </div>
    </RoleGuard>
  )
}
