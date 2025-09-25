"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Role } from "@prisma/client"

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
  MapPin,
  ChevronDown,
  ChevronUp,
  FileText
} from "lucide-react"

interface Approval {
  id: string
  status: string
  comments?: string
  approvedAt?: string
  staff?: {
    name: string
    user: {
      email: string
      uid: string
    }
  }
  hostel?: {
    name: string
    hostelName: string
    user: {
      email: string
      uid: string
    }
  }
  teamLead?: {
    name: string
    clubName: string
    user: {
      email: string
      uid: string
    }
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
  approvals: Approval[]
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
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    if (!session?.user || session.user.role !== Role.SECURITY) {
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
  
  const handleSecurityAction = async (requestId: string, status: "IN" | "OUT") => {
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
        setError(errorData.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      setError("Error updating status")
    } finally {
      setActionLoading(false)
    }
  }
  
  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(requestId)) {
        newSet.delete(requestId)
      } else {
        newSet.add(requestId)
      }
      return newSet
    })
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "APPROVED":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Approved</Badge>
      case "REJECTED":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">✗ Rejected</Badge>
      case "IN":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">✓ Present</Badge>
      case "OUT":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">→ Absent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const getSecurityStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⏳ Awaiting Verification</Badge>
      case "IN":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Present in Hostel</Badge>
      case "OUT":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">→ Left Hostel</Badge>
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
  
  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getApproverInfo = (approval: Approval) => {
    if (approval.staff) {
      return {
        name: approval.staff.name,
        role: "Staff",
        email: approval.staff.user.email,
        uid: approval.staff.user.uid
      }
    }
    if (approval.hostel) {
      return {
        name: approval.hostel.name,
        role: "Hostel Warden",
        email: approval.hostel.user.email,
        uid: approval.hostel.user.uid,
        hostel: approval.hostel.hostelName
      }
    }
    if (approval.teamLead) {
      return {
        name: approval.teamLead.name,
        role: "Team Lead",
        email: approval.teamLead.user.email,
        uid: approval.teamLead.user.uid,
        club: approval.teamLead.clubName
      }
    }
    return null
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
                <p className="text-sm text-gray-600 mt-1">
                  Monitor fully approved stayback requests ({requests.length} requests)
                </p>
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
        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Note:</strong> Only stayback requests approved by all three authorities (Team Lead, Staff, and Hostel Warden) are displayed here for security verification.
          </AlertDescription>
        </Alert>
        
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No fully approved requests</h3>
                <p className="text-gray-500">
                  Stayback requests will appear here once they are approved by Team Lead, Staff, and Hostel Warden.
                </p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => {
              const isExpanded = expandedRequests.has(request.id)
              
              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Main Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.student.name}
                          </h3>
                          {getSecurityStatusBadge(request.securityStatus)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span><strong>Club:</strong> {request.student.clubName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span><strong>Hostel:</strong> {request.student.hostelName} - Room {request.student.roomNo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span><strong>Date:</strong> {formatDate(request.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span><strong>Time:</strong> {request.fromTime} - {request.toTime}</span>
                          </div>
                        </div>
                        
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">
                            <strong>Reason for Stayback:</strong> {request.remarks}
                          </p>
                        </div>
                        
                        {/* Security Comments */}
                        {/* {request.securityComments && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>🔒 Security Notes:</strong> {request.securityComments.replace(/^SECURITY_TRACKING:\w+:[^-]+ - /, '')}
                            </p>
                            {request.securityApprovedAt && (
                              <p className="text-xs text-blue-600 mt-1">
                                Verified at: {formatDateTime(request.securityApprovedAt)}
                              </p>
                            )}
                          </div>
                        )} */}
                      </div>
                    </div>
                    
                    {/* Approval Details - Collapsible */}
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleRequestExpansion(request.id)}
                      className="mb-4"
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Hide Approval Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              View All Approvals (3)
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            All Approvals Received
                          </h4>
                          
                          <div className="space-y-3">
                            {request.approvals.map((approval) => {
                              const approverInfo = getApproverInfo(approval)
                              if (!approverInfo) return null
                              
                              return (
                                <div key={approval.id} className="bg-white rounded-md p-3 border border-green-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900">{approverInfo.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {approverInfo.role}
                                        </Badge>
                                        {getStatusBadge(approval.status)}
                                      </div>
                                      <p className="text-xs text-gray-600">
                                        {approverInfo.email} • UID: {approverInfo.uid}
                                      </p>
                                      {approverInfo.hostel && (
                                        <p className="text-xs text-gray-600">Hostel: {approverInfo.hostel}</p>
                                      )}
                                      {approverInfo.club && (
                                        <p className="text-xs text-gray-600">Club: {approverInfo.club}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {approval.comments && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                                      <FileText className="h-3 w-3 inline mr-1" />
                                      <strong>Comments:</strong> {approval.comments}
                                    </div>
                                  )}
                                  
                                  {approval.approvedAt && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      Approved on: {formatDateTime(approval.approvedAt)}
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                    
                    {/* Security Actions */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Security Verification Actions:</h4>
                      
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
                                Mark as Present
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark Student as Present</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Confirm that <strong>{request.student.name}</strong> is currently present in the hostel.
                                  <br /><br />
                                  <strong>Approved by:</strong>
                                  <ul className="list-disc list-inside mt-2">
                                    {request.approvals.map(a => {
                                      const info = getApproverInfo(a)
                                      return info ? <li key={a.id}>{info.role}: {info.name}</li> : null
                                    })}
                                  </ul>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="my-4">
                                <Textarea
                                  placeholder="Add security verification notes (optional)"
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                  className="min-h-[80px]"
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setComments("")}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleSecurityAction(request.id, "IN")}
                                  disabled={actionLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {actionLoading ? "Marking Present..." : "Confirm Present"}
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
                                Mark as Absent
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark Student as Absent</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Confirm that <strong>{request.student.name}</strong> has left the hostel.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="my-4">
                                <Textarea
                                  placeholder="Add departure verification notes (optional)"
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                  className="min-h-[80px]"
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setComments("")}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleSecurityAction(request.id, "OUT")}
                                  disabled={actionLoading}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {actionLoading ? "Marking Absent..." : "Confirm Absent"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                      
                      {request.securityStatus === "IN" && (
                        <div className="flex gap-2 items-center">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                            ✓ Student is currently Present in Hostel
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Mark as Absent
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark Student as Absent</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Confirm that <strong>{request.student.name}</strong> is leaving the hostel.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="my-4">
                                <Textarea
                                  placeholder="Add departure verification notes (optional)"
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                  className="min-h-[80px]"
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setComments("")}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleSecurityAction(request.id, "OUT")}
                                  disabled={actionLoading}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {actionLoading ? "Marking Absent..." : "Confirm Absent"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                      
                      {request.securityStatus === "OUT" && (
                        <div className="flex gap-2 items-center">
                          <Badge variant="secondary" className="bg-red-100 text-red-800 px-3 py-1">
                            → Student has left the Hostel
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 border-green-300 text-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Mark as Present
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark Student as Present</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Confirm that <strong>{request.student.name}</strong> has returned to the hostel.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="my-4">
                                <Textarea
                                  placeholder="Add return verification notes (optional)"
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                  className="min-h-[80px]"
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setComments("")}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleSecurityAction(request.id, "IN")}
                                  disabled={actionLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {actionLoading ? "Marking Present..." : "Confirm Present"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}