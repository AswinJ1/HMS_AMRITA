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
  LogOut,
  Shield,
  Eye,
  Activity
} from "lucide-react"

interface SecurityStats {
  totalRequests: number
  activeRequests: number
  completedToday: number
  securityChecks: number
  securityName: string
  department: string
}

export default function SecurityDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<SecurityStats>({
    totalRequests: 0,
    activeRequests: 0,
    completedToday: 0,
    securityChecks: 0,
    securityName: "",
    department: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!session?.user || (session.user.role as string) !== "SECURITY") {
      router.push("/unauthorized")
      return
    }
    fetchStats()
  }, [session, router])
  
  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/security/stats")
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError("Failed to fetch statistics")
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
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
              <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">{stats.securityName} - {stats.department}</p>
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
                  Monitor campus security and oversee stayback activities
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <CardDescription>Total Requests</CardDescription>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <CardDescription>Active Monitoring</CardDescription>
                  <p className="text-2xl font-bold text-orange-600">{stats.activeRequests}</p>
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
                  <CardDescription>Completed Today</CardDescription>
                  <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <CardDescription>Security Checks</CardDescription>
                  <p className="text-2xl font-bold text-blue-600">{stats.securityChecks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/security/monitoring" className="block">
              <Card className="hover:shadow-lg transition-all duration-200 border hover:border-purple-300 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <CardTitle className="group-hover:text-purple-600 transition-colors">
                        Monitor Activities
                      </CardTitle>
                      <CardDescription>
                        View ongoing campus activities and staybacks
                      </CardDescription>
                      {stats.activeRequests > 0 && (
                        <Badge variant="secondary" className="mt-2">
                          {stats.activeRequests} active
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/security/reports" className="block">
              <Card className="hover:shadow-lg transition-all duration-200 border hover:border-blue-300 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <CardTitle className="group-hover:text-blue-600 transition-colors">
                        Security Reports
                      </CardTitle>
                      <CardDescription>
                        Generate and view security reports
                      </CardDescription>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/security/alerts" className="block">
              <Card className="hover:shadow-lg transition-all duration-200 border hover:border-red-300 group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <CardTitle className="group-hover:text-red-600 transition-colors">
                        Security Alerts
                      </CardTitle>
                      <CardDescription>
                        View and manage security alerts
                      </CardDescription>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Today's Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Security Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.completedToday}
                </div>
                <div className="text-sm text-gray-600">Activities Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {stats.activeRequests}
                </div>
                <div className="text-sm text-gray-600">Currently Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.securityChecks}
                </div>
                <div className="text-sm text-gray-600">Security Checks Today</div>
              </div>
            </div>
            
            {stats.activeRequests > 0 && (
              <Alert className="mt-6">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  You are currently monitoring {stats.activeRequests} active request{stats.activeRequests !== 1 ? 's' : ''}.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}