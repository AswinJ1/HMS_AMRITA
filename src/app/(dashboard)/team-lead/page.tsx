"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  LogOut,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TeamLeadStats {
  totalApprovals: number
  pendingApprovals: number
  approvedToday: number
  rejectedToday: number
  clubName: string
  clubMembers: number
}

interface SecurityAlert {
  requestId: string
  studentName: string
  status: "IN" | "OUT"
  securityName: string
  timestamp: string
  comments?: string
}

export default function TeamLeadDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<TeamLeadStats>({
    totalApprovals: 0,
    pendingApprovals: 0,
    approvedToday: 0,
    rejectedToday: 0,
    clubName: "",
    clubMembers: 0,
  })
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.role !== "TEAM_LEAD") {
      router.push("/unauthorized")
      return
    }
    fetchStats()
  }, [session, router])

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const approvalsRes = await fetch("/api/approvals")
      if (approvalsRes.ok) {
        const approvals = await approvalsRes.json()

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

        // Get club name from the first approval's request, or fallback to session user name
        let clubName = "Your Club"
        if (approvals.length > 0) {
          clubName = approvals[0].request?.clubName || session?.user?.name || "Your Club"
        }

        // Count unique students who have made requests to this club
        const uniqueStudentIds = new Set()
        approvals.forEach((a: any) => {
          if (a.request?.student?.id) {
            uniqueStudentIds.add(a.request.student.id)
          }
        })
        const clubMembers = uniqueStudentIds.size

        setStats({
          totalApprovals,
          pendingApprovals,
          approvedToday,
          rejectedToday,
          clubName,
          clubMembers,
        })

        // Extract recent security alerts from team lead approvals
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
        setError("Failed to fetch approvals")
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
          <RefreshCw className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Lead Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <User className="h-4 w-4" />
                {stats.clubName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user?.email}
              </span>
              <Button
                onClick={() => signOut()}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back!</h2>
                <p className="text-gray-600 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Manage stayback requests for {stats.clubName} members
                </p>
              </div>
              <Button
                onClick={fetchStats}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Club Members</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.clubMembers}</div>
              <p className="text-xs text-orange-600 mt-1">Active members</p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalApprovals}</div>
              <p className="text-xs text-blue-600 mt-1">All time requests</p>
            </CardContent>
          </Card>
          
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
              <p className="text-xs text-yellow-600 mt-1">Awaiting action</p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
              <p className="text-xs text-green-600 mt-1">Today's approvals</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/team-lead/approvals">
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <CheckCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        Review Approvals
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Process stayback requests from club members
                      </p>
                      {stats.pendingApprovals > 0 && (
                        <Badge variant="destructive" className="mt-2">
                          {stats.pendingApprovals} pending review{stats.pendingApprovals !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Card className="opacity-75 border-dashed">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-500">Manage Club</h4>
                    <p className="text-gray-500 text-sm">Coming soon - Club member management</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Today's Activity & Club Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="text-3xl font-bold text-green-600">
                      {stats.approvedToday}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div className="text-3xl font-bold text-red-600">
                      {stats.rejectedToday}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
              </div>
              
              <div className="text-center pt-4 border-t">
                <div className="text-lg font-medium text-gray-900">
                  {stats.approvedToday > 0 || stats.rejectedToday > 0 ? 
                    Math.round((stats.approvedToday / (stats.approvedToday + stats.rejectedToday)) * 100) 
                    : 0}% Approval Rate
                </div>
                <div className="text-sm text-gray-600">Today's performance</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-600" />
                Club Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Club Name
                </span>
                <span className="text-sm text-gray-900 font-medium">{stats.clubName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Members
                </span>
                <Badge variant="secondary">{stats.clubMembers}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Active Requests
                </span>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {stats.pendingApprovals}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Total Processed
                </span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {stats.totalApprovals - stats.pendingApprovals}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Club Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Club Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  <div className="text-3xl font-bold text-orange-600">
                    {stats.clubMembers}
                  </div>
                </div>
                <div className="text-sm text-orange-700 font-medium">Club Members</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.totalApprovals}
                  </div>
                </div>
                <div className="text-sm text-blue-700 font-medium">Total Requests</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div className="text-3xl font-bold text-yellow-600">
                    {stats.pendingApprovals}
                  </div>
                </div>
                <div className="text-sm text-yellow-700 font-medium">Pending</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <div className="text-3xl font-bold text-green-600">
                    {stats.totalApprovals > 0 ? 
                      Math.round(((stats.totalApprovals - stats.pendingApprovals) / stats.totalApprovals) * 100) 
                      : 0}%
                  </div>
                </div>
                <div className="text-sm text-green-700 font-medium">Completion Rate</div>
              </div>
            </div>
            
            {stats.pendingApprovals > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <div className="text-orange-800">
                    <p className="font-medium mb-1">
                      {stats.pendingApprovals} request{stats.pendingApprovals !== 1 ? 's' : ''} from your club members need{stats.pendingApprovals === 1 ? 's' : ''} your approval.
                    </p>
                    <p className="text-sm">
                      Review them to help your members get timely approvals for their stayback requests.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

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
                  <p className="text-sm text-gray-600">Recent Present/Absent updates from Security</p>
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
                    <Link href="/team-lead/approvals" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                      View all approvals with security updates →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent security alerts</p>
                  <p className="text-xs text-gray-400 mt-1">Security Present/Absent updates will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
