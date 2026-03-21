"use client"

import NotificationsPage from "@/components/notifications-page"
import RoleGuard from "@/components/auth/role-guard"

export default function TeamLeadNotificationsPage() {
  return (
    <RoleGuard allowedRoles={["TEAM_LEAD"]}>
      <NotificationsPage />
    </RoleGuard>
  )
}
