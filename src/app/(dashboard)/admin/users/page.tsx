"use client"

import { useEffect, useState, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import RoleGuard from "@/components/auth/role-guard"
import UsersTable from "@/components/tables/users-table"
import UserForm from "@/components/forms/user-form"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Create, view, and manage system users.
            </p>
          </div>
          <UserForm onCreated={fetchUsers} />
        </div>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <UsersTable users={users} onRefresh={fetchUsers} />
        )}
      </div>
    </RoleGuard>
  )
}
