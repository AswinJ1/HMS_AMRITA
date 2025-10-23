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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
  Shield,
  ArrowLeft,
  ArrowRight
} from "lucide-react"

interface StaffStats {
  totalApprovals: number
  pendingApprovals: number
  approvedToday: number
  rejectedToday: number
  totalStudents: number
  totalTeamLeads: number
}



interface StaffProfile {
  id: string
  email: string
  uid: string
  role: string
  createdAt: string
  staff: {
    id: string
    name: string
    department: string
    createdAt: string
    gender: "male" | "female"
    avatarUrl?: string
  }
}

interface StaybackRequest {
  id: string
  student: {
    id: string
    name: string
    clubName: string
    hostelName: string
    roomNo: string
    user: {
      email: string
      uid: string
    }
  }
  clubName: string
  date: string
  fromTime: string
  toTime: string
  remarks: string
  status: string
  createdAt: string
  securityStatus: string
  securityComments: string | null
  securityApprovedAt: string | null
  securityCheckedBy: string | null
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
   const [requests, setRequests] = useState<StaybackRequest[]>([])
   const [comments, setComments] = useState("")
   useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRequests = async () => {
  setIsLoading(true)
  setError(null)
  
  try {
    // Change from /api/security to /api/staff/security-alerts
    const response = await fetch("/api/security-alerts")
    
    if (response.ok) {
      const data = await response.json()
      setRequests(data.requests || [])
    } else {
      setError("Failed to fetch security alerts")
    }
  } catch (error) {
    console.error("Error fetching requests:", error)
    setError("Error loading security alerts")
  } finally {
    setIsLoading(false)
  }
}

   const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  useEffect(() => {
    if (session?.user?.role !== "STAFF") {
      router.push("/unauthorized")
      return
    }
    fetchStats()
    fetchRequests()
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
            {/* <div>
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
            </div> */}
              <div className="flex items-center gap-4">
              {/* Avatar */}
              {/* <Link href="/student/profile"> */}
                <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300 transition-all">
                  {profile?.staff?.avatarUrl ? (
                    <AvatarImage src={profile.staff.avatarUrl} alt={profile.staff.name} />
                  ) : (
                    <AvatarFallback className="bg-blue-600 text-white">
                      {isLoading ? "..." : profile?.staff?.name ? getInitials(profile.staff.name) : "ST"}
                    </AvatarFallback>
                  )}
                </Avatar>
              {/* </Link> */}
              
              {/* Name and Role */}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isLoading ? "Loading..." : profile?.staff?.name || session?.user?.name || "Staff"}
                </h1>
                <p className="text-sm text-gray-600">
                  {profile?.staff?.department || "Staff Dashboard"}
                </p>
              </div>
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
                <h2 className="text-xl font-semibold text-gray-900"> Welcome back, {profile?.staff?.name?.split(" ")[0] || "Staff"}! 👋</h2>
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
                <div className="p-2  rounded-lg">
                  <FileText className="w-6 h-6 " />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium ">Total Requests</p>
                  <p className="text-2xl font-bold ">{stats.totalApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2  rounded-lg">
                  <Clock className="w-6 h-6 " />
                </div>
                <div className="ml-4">  
                  <p className="text-sm font-medium ">Pending Review</p>
                  <p className="text-2xl font-bold ">{stats.pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2  rounded-lg">
                  <Users className="w-6 h-6 " />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium ">Total Students</p>
                  <p className="text-2xl font-bold ">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2  rounded-lg">
                  <Star className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium ">Team Leads</p>
                  <p className="text-2xl font-bold ">{stats.totalTeamLeads}</p>
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
                    <div className="p-3 ">
                      <CheckCircle className="w-6 h-6 " />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-lg font-semibold  group-hover:text-gray-600 transition-colors">
                        Review Approvals
                      </h4>
                      <p className="text-gray-600 text-sm">Process stayback requests</p>
                      {stats.pendingApprovals > 0 && (
                        <Badge variant="secondary" className="mt-2  hover:bg-gray-100">
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
                    <div className="p-3  ">
                      <Users className="w-6 h-6 " />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
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
                  <div className="p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6 " />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-lg font-semibold ">View Reports</h4>
                    <p className=" text-sm">Coming soon - Analytics and reports</p>
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
                  <div className="text-3xl font-bold  mb-2">
                    {stats.approvedToday}
                  </div>
                  <div className="text-sm ">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold  mb-2">
                    {stats.rejectedToday}
                  </div>
                  <div className="text-sm ">Rejected</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-lg font-medium ">
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
                  <div className="text-3xl font-bold  mb-2">
                    {stats.totalStudents}
                  </div>
                  <div className="text-sm ">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold  mb-2">
                    {stats.totalTeamLeads}
                  </div>
                  <div className="text-sm ">Team Leads</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-sm ">
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
               
                <div>
                  <CardTitle className="text-lg text-black">Security Alerts</CardTitle>
                  <CardDescription>Recent IN/OUT status updates from Security</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.slice(0,2).map((request, id) => (
                    <div key={`${request.id}-${id}`} className={`p-3 rounded-lg border-l-4 ${
                      request.securityStatus === 'IN' ? ' border' : ' border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            request.securityStatus === 'IN' ? 'bg-gray-100 text-black' : 'bg-gray-100 text-black'
                          }`}>
                            {request.securityStatus === 'IN' ? 'Present' : 'Absent'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {request.student.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              is {request.securityStatus === 'IN' ? 'present' : 'absent'} <br />
                              at {request.securityApprovedAt ? new Date(request.securityApprovedAt).toLocaleString() : 'Unknown time'}
                            </p>
                          </div>
                        </div>
                       
                      </div>
                    </div>
                    
                  ))}
                 <div> <span>Showing First {requests.length} Security Status</span> </div>

                  <div className="pt-2 border-t border-gray-200">
                  
                       <Link href="/staff/approvals">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Go to Approvals Page
            </Button>
          </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No recent security Status</p>
                  <p className="text-xs text-gray-400 mt-1">Security Present/Absent updates will appear here</p>
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
