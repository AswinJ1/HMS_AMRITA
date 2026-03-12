"use client"

import { useState } from "react"
import RoleGuard from "@/components/auth/role-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Settings, Shield, Database, Loader2 } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            System configuration and administration settings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                <CardTitle className="text-base">Security</CardTitle>
              </div>
              <CardDescription>Authentication and access control settings.</CardDescription>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="size-5 text-primary" />
                <CardTitle className="text-base">System</CardTitle>
              </div>
              <CardDescription>Database and system information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Authentication</p>
                  <p className="text-xs text-muted-foreground">NextAuth v4 with Credentials</p>
                </div>
                <Badge variant="secondary">JWT</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
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
        </div>
      </div>
    </RoleGuard>
  )
}
