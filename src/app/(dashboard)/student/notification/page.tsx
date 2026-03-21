"use client"

import NotificationsPage from "@/components/notifications-page"
import RoleGuard from "@/components/auth/role-guard"

export default function StudentNotificationsPage() {
  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <NotificationsPage />
    </RoleGuard>
  )
}
