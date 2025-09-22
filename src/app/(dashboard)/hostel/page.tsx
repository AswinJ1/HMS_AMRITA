"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// shadcn/ui imports
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

// Icons (assuming you have Lucide icons installed)
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Users,
  LogOut
} from "lucide-react"

interface HostelStats {
  totalApprovals: number
  pendingApprovals: number
  approvedToday: number
  rejectedToday: number
  hostelName: string
}

export default function HostelDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<HostelStats>({
    totalApprovals: 0,
    pendingApprovals: 0,
    approvedToday: 0,
    rejectedToday: 0,
    hostelName: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (session?.user?.role !== "HOSTEL") {
      router.push("/unauthorized")
      return
    }
    fetchStats()
  }, [session, router])
  
  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/approvals")
      
      if (response.ok) {
        const approvals = await response.json()
        
        // Calculate today's date
        const today = new Date().toDateString()
        
        // Calculate stats
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
        
        // Get hostel name from session or first approval
        const hostelName = session?.user?.name || 
                          (approvals[0]?.request?.student?.hostelName) || 
                          "Hostel"
        
        setStats({
          totalApprovals,
          pendingApprovals,
          approvedToday,
          rejectedToday,
          hostelName,
        })
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
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hostel Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">{stats.hostelName}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user?.email}
              </span>
              <Button 
                variant="destructive"
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Welcome back!</h2>
                <p className="text-gray-600 mt-1">
                  Manage stayback approvals for {stats.hostelName}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={fetchStats}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <CardDescription>Total Requests</CardDescription>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <CardDescription>Pending Review</CardDescription>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <CardDescription>Approved Today</CardDescription>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <CardDescription>Rejected Today</CardDescription>
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/hostel/approvals" className="block">
              <Card className="hover:shadow-lg transition-all duration-200 border hover:border-blue-300 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <CardTitle className="group-hover:text-blue-600 transition-colors">
                        Review Approvals
                      </CardTitle>
                      <CardDescription>
                        View and process stayback requests
                      </CardDescription>
                      {stats.pendingApprovals > 0 && (
                        <Badge variant="secondary" className="mt-2">
                          {stats.pendingApprovals} pending review{stats.pendingApprovals !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <CardTitle>View Reports</CardTitle>
                    <CardDescription>Coming soon - Analytics and reports</CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Today's Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.approvedToday + stats.rejectedToday}
                </div>
                <div className="text-sm text-gray-600">Requests Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {stats.pendingApprovals}
                </div>
                <div className="text-sm text-gray-600">Awaiting Review</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.approvedToday > 0 ? 
                    Math.round((stats.approvedToday / (stats.approvedToday + stats.rejectedToday)) * 100) || 0 
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Approval Rate Today</div>
              </div>
            </div>
            
            {stats.pendingApprovals > 0 && (
              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have {stats.pendingApprovals} request{stats.pendingApprovals !== 1 ? 's' : ''} awaiting your review.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
