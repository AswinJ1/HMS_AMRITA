"use client"

import RoleGuard from "@/components/auth/role-guard"
import StaybackForm from "@/components/forms/stayback-form"

export default function StudentStaybackPage() {
  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Apply for Stayback</h1>
          <p className="text-sm text-muted-foreground">
            Submit a new stayback request. It will be routed through Team Lead → Staff → Warden.
          </p>
        </div>
        <StaybackForm />
      </div>
    </RoleGuard>
  )
}
