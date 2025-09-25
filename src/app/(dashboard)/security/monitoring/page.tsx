"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// shadcn/ui imports
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Icons
import { 
  ArrowLeft,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Eye,
  User,
  Calendar,
  MapPin
} from "lucide-react"

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
  approvals: any[]
}

export default function SecurityMonitoring() {
  const { data: session } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<StaybackRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<StaybackRequest | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [comments, setComments] = useState("")
  
  useEffect(() => {
    if (session?.user?.role !== "SECURITY") {
      router.push("/unauthorized")
      return
    }
    fetchRequests()
  }, [session, router])
  
  const fetchRequests = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/security")
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        setError("Failed to fetch stayback requests")
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      setError("Error loading requests")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSecurityAction = async (requestId: string, status: "APPROVED" | "REJECTED" | "IN" | "OUT") => {
    setActionLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/security", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          status,
          comments
        }),
      })
      
      if (response.ok) {
        await fetchRequests() // Refresh the data
        setSelectedRequest(null)
        setComments("")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update approval")
      }
    } catch (error) {
      console.error("Error updating approval:", error)
      setError("Error updating approval")
    } finally {
      setActionLoading(false)
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>
      case "APPROVED":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Approved</Badge>
      case "REJECTED":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>
      case "IN":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Present</Badge>
      case "OUT":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">→ Absent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const formatTime = (timeString: string) => {
    return timeString
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/security">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Security Monitoring</h1>
                <p className="text-sm text-gray-600 mt-1">Monitor and approve stayback activities</p>
              </div>
            </div>
            <Button onClick={fetchRequests} variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No stayback requests to monitor</h3>
                <p className="text-gray-500">All stayback activities will appear here for security monitoring.</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.student.name}
                        </h3>
                        {getStatusBadge(request.securityStatus)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{request.student.clubName} • {request.student.hostelName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Room {request.student.roomNo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(request.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(request.fromTime)} - {formatTime(request.toTime)}</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Purpose:</strong> {request.remarks}
                        </p>
                      </div>
                      
                      {request.securityComments && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-800">
                            <strong>Security Notes:</strong> {request.securityComments.replace(/^SECURITY_TRACKING:\w+:[^-]+ - /, '')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {request.securityStatus === "PENDING" && (
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="gap-2 bg-green-600 hover:bg-green-700"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Present
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mark Student as Present</AlertDialogTitle>
                            <AlertDialogDescription>
                              Confirm that {request.student.name} has arrived at the hostel and is now Present.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="my-4">
                            <Textarea
                              placeholder="Add security verification notes (optional)"
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setComments("")}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleSecurityAction(request.id, "IN")}
                              disabled={actionLoading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading ? "Marking Present..." : "Mark Present"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <XCircle className="h-4 w-4" />
                            Absent
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mark Student as Absent</AlertDialogTitle>
                            <AlertDialogDescription>
                              Confirm that {request.student.name} has left the hostel and is now Absent.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="my-4">
                            <Textarea
                              placeholder="Add departure verification notes (optional)"
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setComments("")}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleSecurityAction(request.id, "OUT")}
                              disabled={actionLoading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {actionLoading ? "Marking Absent..." : "Mark Absent"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  
                  {request.securityStatus === "IN" && (
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ✓ Student is Present
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Absent
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mark Student as Absent</AlertDialogTitle>
                            <AlertDialogDescription>
                              Confirm that {request.student.name} is leaving the hostel and is now Absent.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="my-4">
                            <Textarea
                              placeholder="Add departure verification notes"
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setComments("")}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleSecurityAction(request.id, "OUT")}
                              disabled={actionLoading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {actionLoading ? "Marking Absent..." : "Mark Absent"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  
                  {request.securityStatus === "OUT" && (
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        → Student is Absent
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Present
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Mark Student as Present</AlertDialogTitle>
                            <AlertDialogDescription>
                              Confirm that {request.student.name} has returned to the hostel and is now Present.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="my-4">
                            <Textarea
                              placeholder="Add return verification notes"
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setComments("")}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleSecurityAction(request.id, "IN")}
                              disabled={actionLoading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading ? "Marking Present..." : "Mark Present"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}