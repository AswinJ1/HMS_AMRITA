// app/(dashboard)/admin/page.tsx

"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Stats {
  totalUsers: number
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🔄 Fetching admin stats...")
      
      const [usersRes, logsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/logs"),
      ])
      
      console.log("📊 Users response status:", usersRes.status)
      console.log("📊 Logs response status:", logsRes.status)
      
      if (!usersRes.ok) {
        throw new Error(`Users API failed: ${usersRes.status}`)
      }
      
      if (!logsRes.ok) {
        throw new Error(`Logs API failed: ${logsRes.status}`)
      }
      
      const users = await usersRes.json()
      const logs = await logsRes.json()
      
      console.log("👥 Users data:", users)
      console.log("📋 Logs data:", logs)
      
      // Handle different possible response structures
      const statusStats = logs.stats?.status || logs.stats || {}
      const requestsArray = logs.requests || logs || []
      
      setStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalRequests: Array.isArray(requestsArray) ? requestsArray.length : (logs.total || 0),
        pendingRequests: statusStats.PENDING || 0,
        approvedRequests: statusStats.APPROVED || 0,
        rejectedRequests: statusStats.REJECTED || 0,
      })
      
      console.log("✅ Stats updated:", {
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalRequests: Array.isArray(requestsArray) ? requestsArray.length : (logs.total || 0),
        pendingRequests: statusStats.PENDING || 0,
        approvedRequests: statusStats.APPROVED || 0,
        rejectedRequests: statusStats.REJECTED || 0,
      })
      
    } catch (error) {
      console.error("❌ Error fetching stats:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Admin: {session?.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
            <button
              onClick={fetchStats}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRequests}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingRequests}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Approved</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approvedRequests}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejectedRequests}</p>
          </div>
        </div>
        
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/users"
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Manage Users</h2>
            <p className="text-gray-600">Create, view, and delete users</p>
          </Link>
          
          <Link
            href="/admin/logs"
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">View Logs</h2>
            <p className="text-gray-600">View all stayback requests and filter by date</p>
          </Link>
          
          <Link
            href="/admin/create-user"
            className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Create User</h2>
            <p className="text-gray-600">Create new staff or hostel users</p>
          </Link>
        </div>
      </main>
    </div>
  )
}