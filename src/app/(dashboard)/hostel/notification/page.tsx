"use client"

import NotificationsPage from "@/components/notifications-page"
import RoleGuard from "@/components/auth/role-guard"

export default function HostelNotificationsPage() {
  return (
    <RoleGuard allowedRoles={["HOSTEL"]}>
      <NotificationsPage />
    </RoleGuard>
  )
}
