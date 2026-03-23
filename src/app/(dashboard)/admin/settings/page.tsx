"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import RoleGuard from "@/components/auth/role-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Settings, Shield, Database, Loader2, Lock, Trash2, Users, BarChart3, AlertTriangle } from "lucide-react"

interface SystemStats {
  usersByRole: Record<string, number>
  requestsByStage: Record<string, number>
  totalUsers: number
  totalRequests: number
}

export default function AdminSettingsPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  // Purge
  const [purgeDays, setPurgeDays] = useState("90")
  const [purging, setPurging] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      setLoadingStats(true)
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      toast.error("Failed to load system stats")
    } finally {
      setLoadingStats(false)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Password changed successfully")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(data.error || "Failed to change password")
      }
    } catch {
      toast.error("Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  async function handlePurge() {
    const days = parseInt(purgeDays)
    if (isNaN(days) || days < 1) {
      toast.error("Enter a valid number of days (minimum 1)")
      return
    }

    if (!confirm(`Are you sure you want to delete all completed/rejected requests older than ${days} days? This cannot be undone.`)) {
      return
    }

    setPurging(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purge", days }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        fetchStats() // Refresh stats
      } else {
        toast.error(data.error || "Purge failed")
      }
    } catch {
      toast.error("Purge failed")
    } finally {
      setPurging(false)
    }
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            System configuration, stats, and administration.
          </p>
        </div>

        {/* Live System Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loadingStats ? (
            [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <Card>
                <CardContent className="flex items-start justify-between p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Users</p>
                    <p className="mt-1 text-2xl font-bold">{stats?.totalUsers ?? 0}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">All registered accounts</p>
                  </div>
                  <div className="flex size-9 items-center justify-center bg-primary/10 text-primary"><Users className="size-4" /></div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start justify-between p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Requests</p>
                    <p className="mt-1 text-2xl font-bold">{stats?.totalRequests ?? 0}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">All stayback requests</p>
                  </div>
                  <div className="flex size-9 items-center justify-center bg-primary/10 text-primary"><BarChart3 className="size-4" /></div>
                </CardContent>
              </Card>
              <Card className="sm:col-span-2">
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Users by Role</p>
                  <div className="flex flex-wrap gap-2">
                    {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
                      <div key={role} className="flex items-center gap-2 border p-2 px-3">
                        <Badge variant="outline" className="text-[10px] font-semibold">{role.replace("_", " ")}</Badge>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Request Stage Breakdown */}
        {stats?.requestsByStage && Object.keys(stats.requestsByStage).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Stages</CardTitle>
              <CardDescription>Live distribution by approval stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(stats.requestsByStage).map(([stage, count]) => (
                  <div key={stage} className="border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {stage.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="size-5 text-primary" />
                <CardTitle className="text-base">Change Password</CardTitle>
              </div>
              <CardDescription>Update your admin account password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <Button type="submit" size="sm" disabled={changingPassword} className="w-full">
                  {changingPassword ? <><Loader2 className="mr-2 size-3.5 animate-spin" /> Changing...</> : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security & System Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                <CardTitle className="text-base">Security & System</CardTitle>
              </div>
              <CardDescription>Authentication and system information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Password Policy</p>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters required</p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Session Timeout</p>
                  <p className="text-xs text-muted-foreground">JWT-based sessions with 30-day expiry</p>
                </div>
                <Badge variant="secondary">30 days</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Approval Workflow</p>
                  <p className="text-xs text-muted-foreground">Team Lead → Staff → Warden cascade</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-muted-foreground">PostgreSQL with Prisma ORM</p>
                </div>
                <Badge variant="secondary">Connected</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Framework</p>
                  <p className="text-xs text-muted-foreground">Next.js 14 with App Router</p>
                </div>
                <Badge variant="outline">v14</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              <CardTitle className="text-base">Roles</CardTitle>
            </div>
            <CardDescription>Available roles in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { role: "ADMIN", desc: "Full system access" },
                { role: "STAFF", desc: "Approve staybacks, promote TLs" },
                { role: "STUDENT", desc: "Submit stayback requests" },
                { role: "TEAM_LEAD", desc: "First-level approval" },
                { role: "HOSTEL", desc: "Warden final approval" },
                { role: "SECURITY", desc: "Gate monitoring" },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-2 border p-2.5 px-3 min-w-[200px]">
                  <Badge variant="outline" className="text-[10px] font-semibold">{r.role}</Badge>
                  <span className="text-xs text-muted-foreground">{r.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>Irreversible actions. Proceed with caution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="purgeDays" className="text-xs">Purge completed/rejected requests older than</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="purgeDays"
                    type="number"
                    min="1"
                    value={purgeDays}
                    onChange={(e) => setPurgeDays(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={purging}
                onClick={handlePurge}
              >
                {purging ? (
                  <><Loader2 className="mr-2 size-3.5 animate-spin" /> Purging...</>
                ) : (
                  <><Trash2 className="mr-2 size-3.5" /> Purge Old Data</>
                )}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              This will permanently delete all completed and rejected stayback requests older than the specified number of days. This action cannot be undone.
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
