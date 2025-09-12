// components/auth/role-guard.tsx

"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Role } from "@prisma/client"

interface RoleGuardProps {
  allowedRoles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/login")
      return
    }
    
    if (!allowedRoles.includes(session.user.role)) {
      const dashboardUrl = getDashboardUrl(session.user.role)
      router.push(dashboardUrl)
    }
  }, [session, status, allowedRoles, router])
  
  if (status === "loading") {
    return <div>Loading...</div>
  }
  
  if (!session || !allowedRoles.includes(session.user.role)) {
    return fallback ? <>{fallback}</> : null
  }
  
  return <>{children}</>
}

function getDashboardUrl(role: Role): string {
  const dashboards: Record<Role, string> = {
    ADMIN: "/admin",
    STAFF: "/staff",
    STUDENT: "/student",
    TEAM_LEAD: "/team-lead",
    HOSTEL: "/hostel",
  }
  return dashboards[role] || "/"
}