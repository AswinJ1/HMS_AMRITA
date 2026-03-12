"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && !allowedRoles.includes(session?.user?.role || "")) {
      router.push("/login")
    }
  }, [session, status, allowedRoles, router])

  if (status === "loading") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (status === "authenticated" && allowedRoles.includes(session?.user?.role || "")) {
    return <>{children}</>
  }

  return null
}
