"use client"

import NotificationsPage from "@/components/notifications-page"
import RoleGuard from "@/components/auth/role-guard"

export default function SecurityNotificationsPage() {
  return (
    <RoleGuard allowedRoles={["SECURITY"]}>
      <NotificationsPage />
    </RoleGuard>
  )
}
