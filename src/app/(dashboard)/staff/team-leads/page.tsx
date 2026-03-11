"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import RoleGuard from "@/components/auth/role-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Users, UserCog, ArrowUpCircle, Loader2, RefreshCcw } from "lucide-react"

interface Student {
  id: string
  name: string
  clubName: string
  hostelName: string
  roomNo: string
  phoneNumber: string
  isTeamLead: boolean
  user: { id: string; email: string; uid?: string; role: string }
}

interface TeamLead {
  id: string
  name: string
  clubName: string
  department?: string
  user: { id: string; email: string; uid?: string; role: string }
}

interface User {
  id: string
  email: string
  uid?: string
  role: string
  student?: Student
  teamLead?: TeamLead
}

export default function TeamLeadsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [promoteLoading, setPromoteLoading] = useState<string | null>(null)
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [promoteForm, setPromoteForm] = useState({ clubName: "", department: "" })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : [])
      } else {
        toast.error("Failed to fetch users")
      }
    } catch {
      toast.error("Error fetching users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const students = users.filter((u) => u.role === "STUDENT" && u.student && !u.student.isTeamLead)
  const teamLeads = users.filter((u) => u.role === "TEAM_LEAD" && u.teamLead)

  function openPromote(student: Student) {
    setSelectedStudent(student)
    setPromoteForm({ clubName: student.clubName || "", department: "" })
    setShowPromoteDialog(true)
  }

  async function submitPromotion() {
    if (!selectedStudent || !promoteForm.clubName.trim()) return
    setPromoteLoading(selectedStudent.id)
    try {
      const res = await fetch("/api/users/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          clubName: promoteForm.clubName.trim(),
          department: promoteForm.department.trim() || undefined,
        }),
      })
      if (res.ok) {
        toast.success(`${selectedStudent.name} promoted to Team Lead`)
        setShowPromoteDialog(false)
        setSelectedStudent(null)
        fetchUsers()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to promote")
      }
    } catch {
      toast.error("Error promoting student")
    } finally {
      setPromoteLoading(null)
    }
  }

  return (
    <RoleGuard allowedRoles={["STAFF"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Team Lead Management</h1>
            <p className="text-sm text-muted-foreground">
              View students and promote them to team leads.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCcw className="mr-2 size-3.5" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <UserCog className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamLeads.length}</p>
                <p className="text-xs text-muted-foreground">Team Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ArrowUpCircle className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-xs text-muted-foreground">Available to Promote</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="students" className="space-y-4">
            <TabsList>
              <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
              <TabsTrigger value="teamleads">Team Leads ({teamLeads.length})</TabsTrigger>
            </TabsList>

            {/* Students Tab */}
            <TabsContent value="students">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Students</CardTitle>
                  <CardDescription>Select a student to promote to team lead.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Users className="size-10 text-muted-foreground/40" />
                      <p className="mt-3 text-sm text-muted-foreground">No students available for promotion.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Name</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Email</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">UID</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Hostel</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.student!.name}</TableCell>
                            <TableCell className="text-muted-foreground">{u.email}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-[11px]">{u.uid || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">{u.student!.clubName}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{u.student!.hostelName} — Room {u.student!.roomNo}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openPromote(u.student!)}
                                disabled={!!promoteLoading}
                              >
                                <ArrowUpCircle className="mr-1.5 size-3.5" />
                                Promote
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Leads Tab */}
            <TabsContent value="teamleads">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Current Team Leads</CardTitle>
                  <CardDescription>Active team leads in the system.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {teamLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <UserCog className="size-10 text-muted-foreground/40" />
                      <p className="mt-3 text-sm text-muted-foreground">No team leads found.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Name</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Email</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">UID</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Department</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamLeads.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.teamLead!.name}</TableCell>
                            <TableCell className="text-muted-foreground">{u.email}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-[11px]">{u.uid || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">{u.teamLead!.clubName}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{u.teamLead!.department || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] font-semibold">Team Lead</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Promote Dialog */}
        <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promote to Team Lead</DialogTitle>
              <DialogDescription>
                Promoting <span className="font-semibold text-foreground">{selectedStudent?.name}</span> from Student to Team Lead role.
              </DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                <div className="grid gap-1 text-sm bg-muted/50 p-3 border">
                  <p><span className="font-medium text-muted-foreground">Current Club:</span> {selectedStudent.clubName}</p>
                  <p><span className="font-medium text-muted-foreground">Hostel:</span> {selectedStudent.hostelName} — Room {selectedStudent.roomNo}</p>
                  <p><span className="font-medium text-muted-foreground">Phone:</span> {selectedStudent.phoneNumber}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Club Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={promoteForm.clubName}
                    onChange={(e) => setPromoteForm({ ...promoteForm, clubName: e.target.value })}
                    placeholder="Enter club name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Department (Optional)
                  </Label>
                  <Input
                    value={promoteForm.department}
                    onChange={(e) => setPromoteForm({ ...promoteForm, department: e.target.value })}
                    placeholder="Enter department"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPromoteDialog(false)} disabled={!!promoteLoading}>
                Cancel
              </Button>
              <Button
                onClick={submitPromotion}
                disabled={!!promoteLoading || !promoteForm.clubName.trim()}
              >
                {promoteLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Promoting...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="mr-2 size-4" />
                    Promote to Team Lead
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}