"use client"

import NotificationsPage from "@/components/notifications-page"
import RoleGuard from "@/components/auth/role-guard"

export default function AdminNotificationsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <NotificationsPage />
    </RoleGuard>
  )
}
