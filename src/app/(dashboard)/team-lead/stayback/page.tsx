"use client"

import RoleGuard from "@/components/auth/role-guard"
import StaybackForm from "@/components/forms/stayback-form"

export default function TeamLeadStaybackPage() {
  return (
    <RoleGuard allowedRoles={["TEAM_LEAD"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Apply for Stayback</h1>
          <p className="text-sm text-muted-foreground">
            Submit your own stayback request. It will be routed through Staff → Warden.
          </p>
        </div>
        <StaybackForm />
      </div>
    </RoleGuard>
  )
}
