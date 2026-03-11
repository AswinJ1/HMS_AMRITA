"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, Trash2, Pencil, KeyRound, MoreHorizontal, Loader2 } from "lucide-react"
import { toast } from "sonner"

const roleBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ADMIN: { label: "Admin", variant: "default" },
  STAFF: { label: "Staff", variant: "secondary" },
  STUDENT: { label: "Student", variant: "outline" },
  TEAM_LEAD: { label: "Team Lead", variant: "outline" },
  HOSTEL: { label: "Warden", variant: "secondary" },
  SECURITY: { label: "Security", variant: "secondary" },
}

interface User {
  id: string
  email: string
  uid?: string
  role: string
  createdAt: string
  student?: { name: string; clubName?: string; hostelName?: string; roomNo?: string; phoneNumber?: string } | null
  staff?: { name: string; department?: string } | null
  hostel?: { name: string; hostelName?: string } | null
  teamLead?: { name: string; clubName?: string; department?: string } | null
  admin?: { name: string } | null
  security?: { name: string; department?: string } | null
}

function getUserName(u: User): string {
  return u.student?.name || u.staff?.name || u.hostel?.name || u.teamLead?.name || u.admin?.name || u.security?.name || "—"
}

function getUserDetail(u: User): string {
  return u.staff?.department || u.hostel?.hostelName || u.teamLead?.clubName || u.security?.department || ""
}

function getEditableFields(u: User): Record<string, string> {
  const fields: Record<string, string> = { name: getUserName(u), email: u.email, uid: u.uid || "" }
  switch (u.role) {
    case "STUDENT":
      fields.clubName = u.student?.clubName || ""
      fields.hostelName = u.student?.hostelName || ""
      fields.roomNo = u.student?.roomNo || ""
      fields.phoneNumber = u.student?.phoneNumber || ""
      break
    case "STAFF":
      fields.department = u.staff?.department || ""
      break
    case "HOSTEL":
      fields.hostelName = u.hostel?.hostelName || ""
      break
    case "TEAM_LEAD":
      fields.clubName = u.teamLead?.clubName || ""
      fields.department = u.teamLead?.department || ""
      break
    case "SECURITY":
      fields.department = u.security?.department || ""
      break
  }
  return fields
}

const fieldLabels: Record<string, string> = {
  name: "Name",
  email: "Email",
  uid: "UID",
  clubName: "Club",
  hostelName: "Hostel",
  roomNo: "Room No",
  phoneNumber: "Phone",
  department: "Department",
}

export default function UsersTable({ users, onRefresh }: { users: User[]; onRefresh?: () => void }) {
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const [editLoading, setEditLoading] = useState(false)
  const [pwUser, setPwUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [pwLoading, setPwLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  function openEdit(u: User) {
    setEditUser(u)
    setEditFields(getEditableFields(u))
  }

  async function submitEdit() {
    if (!editUser) return
    setEditLoading(true)
    try {
      const res = await fetch("/api/users/edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editUser.id, ...editFields }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      toast.success("User updated successfully")
      setEditUser(null)
      onRefresh?.()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setEditLoading(false)
    }
  }

  async function submitPasswordChange() {
    if (!pwUser || !newPassword) return
    setPwLoading(true)
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pwUser.id, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      toast.success("Password changed successfully")
      setPwUser(null)
      setNewPassword("")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setPwLoading(false)
    }
  }

  async function handleDelete(userId: string) {
    try {
      const res = await fetch(`/api/users?userId=${userId}`, { method: "DELETE" })
      if (!res.ok) {
        const r = await res.json()
        throw new Error(r.error || "Failed")
      }
      toast.success("User deleted")
      onRefresh?.()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (!users.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">No users found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Users</CardTitle>
          <CardDescription>{users.length} total</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">UID</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Detail</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const badge = roleBadge[u.role] || { label: u.role, variant: "outline" as const }
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{getUserName(u)}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-[11px]">{u.uid || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} className="text-[10px] font-semibold">{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getUserDetail(u)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="size-8 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Pencil className="mr-2 size-3.5" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setPwUser(u); setNewPassword("") }}>
                            <KeyRound className="mr-2 size-3.5" />
                            Change Password
                          </DropdownMenuItem>
                          {u.role !== "ADMIN" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteConfirmId(u.id)}
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Editing <span className="font-semibold text-foreground">{editUser ? getUserName(editUser) : ""}</span>
              {editUser && (
                <Badge variant={roleBadge[editUser.role]?.variant || "outline"} className="ml-2 text-[10px]">
                  {roleBadge[editUser.role]?.label || editUser.role}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {Object.entries(editFields).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {fieldLabels[key] || key}
                </Label>
                <Input
                  value={value}
                  onChange={(e) => setEditFields({ ...editFields, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} disabled={editLoading}>
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={editLoading}>
              {editLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Pencil className="mr-2 size-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!pwUser} onOpenChange={(open) => { if (!open) { setPwUser(null); setNewPassword("") } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for <span className="font-semibold text-foreground">{pwUser ? getUserName(pwUser) : ""}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New Password
            </Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwUser(null); setNewPassword("") }} disabled={pwLoading}>
              Cancel
            </Button>
            <Button onClick={submitPasswordChange} disabled={pwLoading || newPassword.length < 6}>
              {pwLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteConfirmId) { handleDelete(deleteConfirmId); setDeleteConfirmId(null) } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
