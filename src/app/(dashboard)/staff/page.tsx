"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Import shadcn/ui components - make sure these are installed first
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import icons - install lucide-react if not already installed: npm install lucide-react
import { 
  Loader2, 
  FileText, 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  BarChart3,
  RefreshCw,
  Shield
} from "lucide-react"

interface StaffStats {
  totalApprovals: number
  pendingApprovals: number
  approvedToday: number
  rejectedToday: number
  totalStudents: number
  totalTeamLeads: number
}

interface SecurityAlert {
  requestId: string
  studentName: string
  status: "IN" | "OUT"
  securityName: string
  timestamp: string
  comments?: string
}

export default function StaffDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<StaffStats>({
    totalApprovals: 0,
    pendingApprovals: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalStudents: 0,
    totalTeamLeads: 0,
  })
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.role !== "STAFF") {
      router.push("/unauthorized")
      return
    }
    fetchStats()
  }, [session, router])

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [approvalsRes, usersRes] = await Promise.all([
        fetch("/api/approvals"),
        fetch("/api/users"),
      ])
      
      if (approvalsRes.ok && usersRes.ok) {
        const approvals = await approvalsRes.json()
        const users = await usersRes.json()
        
        // Calculate today's date
        const today = new Date().toDateString()
        
        // Calculate approval stats
        const totalApprovals = approvals.length
        const pendingApprovals = approvals.filter((a: any) => a.status === "PENDING").length
        const approvedToday = approvals.filter((a: any) => 
          a.status === "APPROVED" && 
          new Date(a.approvedAt || a.createdAt).toDateString() === today
        ).length
        const rejectedToday = approvals.filter((a: any) => 
          a.status === "REJECTED" && 
          new Date(a.approvedAt || a.createdAt).toDateString() === today
        ).length
        
        // Calculate user stats
        const totalStudents = users.filter((u: any) => u.role === "STUDENT").length
        const totalTeamLeads = users.filter((u: any) => u.role === "TEAM_LEAD").length
        
        setStats({
          totalApprovals,
          pendingApprovals,
          approvedToday,
          rejectedToday,
          totalStudents,
          totalTeamLeads,
        })

        // Extract recent security alerts from staff approvals
        const recentSecurityAlerts: SecurityAlert[] = []
        
        approvals.forEach((approval: any) => {
          if (approval.comments && approval.comments.includes('[SECURITY UPDATE]')) {
            const lines = approval.comments.split('\n')
            lines.forEach((line: string) => {
              if (line.includes('[SECURITY UPDATE]')) {
                const securityMatch = line.match(/\[SECURITY UPDATE\] Student marked as (IN|OUT) by Security: ([^-]+)(?:-(.+))?/)
                if (securityMatch) {
                  const [, status, securityName, additionalComment] = securityMatch
                  recentSecurityAlerts.push({
                    requestId: approval.request?.id || approval.id,
                    studentName: approval.request?.student?.name || 'Unknown Student',
                    status: status as "IN" | "OUT",
                    securityName: securityName.trim(),
                    timestamp: approval.updatedAt || approval.createdAt,
                    comments: additionalComment?.trim()
                  })
                }
              }
            })
          }
        })

        // Sort by timestamp (most recent first) and limit to 5
        const sortedAlerts = recentSecurityAlerts
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
        
        setSecurityAlerts(sortedAlerts)
      } else {
        setError("Failed to fetch statistics")
      }
    } catch (error) {
      setError("Error loading dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Using regular div since shadcn Card might conflict with header styling */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage approvals and team leads</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user?.email}
              </span>
              <Button
                onClick={() => signOut()}
                variant="destructive"
                size="default"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Welcome back!</h2>
                <p className="text-gray-600 mt-1">
                  Review stayback requests and manage team lead assignments
                </p>
              </div>
              <Button
                onClick={fetchStats}
                variant="outline"
                size="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Team Leads</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalTeamLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/staff/approvals" className="group transition-all duration-200">
              <Card className="hover:shadow-lg border-gray-200 hover:border-blue-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        Review Approvals
                      </h4>
                      <p className="text-gray-600 text-sm">Process stayback requests</p>
                      {stats.pendingApprovals > 0 && (
                        <Badge variant="secondary" className="mt-2 bg-orange-100 text-orange-600 hover:bg-orange-200">
                          {stats.pendingApprovals} pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/staff/team-leads" className="group transition-all duration-200">
              <Card className="hover:shadow-lg border-gray-200 hover:border-orange-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        Manage Team Leads
                      </h4>
                      <p className="text-gray-600 text-sm">Promote students to team leads</p>
                      <Badge variant="outline" className="mt-2">
                        {stats.totalTeamLeads} active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">View Reports</h4>
                    <p className="text-gray-600 text-sm">Coming soon - Analytics and reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {stats.approvedToday}
                  </div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {stats.rejectedToday}
                  </div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-lg font-medium text-gray-900">
                  {stats.approvedToday > 0 || stats.rejectedToday > 0 ? 
                    Math.round((stats.approvedToday / (stats.approvedToday + stats.rejectedToday)) * 100) 
                    : 0}% Approval Rate
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {stats.totalStudents}
                  </div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {stats.totalTeamLeads}
                  </div>
                  <div className="text-sm text-gray-600">Team Leads</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-600">
                  {stats.totalStudents - stats.totalTeamLeads} students available for promotion
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Alerts Section */}
        <div className="mb-8">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-red-700">Security Alerts</CardTitle>
                  <CardDescription>Recent IN/OUT status updates from Security</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {securityAlerts.length > 0 ? (
                <div className="space-y-3">
                  {securityAlerts.map((alert, index) => (
                    <div key={`${alert.requestId}-${index}`} className={`p-3 rounded-lg border-l-4 ${
                      alert.status === 'IN' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            alert.status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {alert.status === 'IN' ? 'Present' : 'Absent'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {alert.studentName}
                            </p>
                            <p className="text-xs text-gray-600">
                              by {alert.securityName}
                              {alert.comments && ` - ${alert.comments}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <Link href="/staff/approvals" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                      View all approvals with security updates →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent security alerts</p>
                  <p className="text-xs text-gray-400 mt-1">Security IN/OUT updates will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {stats.pendingApprovals > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              You have {stats.pendingApprovals} stayback request{stats.pendingApprovals !== 1 ? 's' : ''} awaiting your review.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  )
}
