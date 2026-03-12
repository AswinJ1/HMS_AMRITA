"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import RoleGuard from "@/components/auth/role-guard"
import RequestsTable from "@/components/tables/requests-table"

export default function StudentRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/stayback")
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">My Requests</h1>
          <p className="text-sm text-muted-foreground">
            Track the status of all your stayback requests.
          </p>
        </div>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <RequestsTable requests={requests} />
        )}
      </div>
    </RoleGuard>
  )
}
