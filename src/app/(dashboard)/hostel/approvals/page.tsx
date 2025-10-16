"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, RefreshCw, ArrowLeft, FileText, Clock, CheckCircle, XCircle, Users, Building, ChevronDown, User, MapPin, Phone, Calendar, Building2 } from "lucide-react"

interface StaybackApproval {
  id: string
  requestId: string  // Added requestId
  status: "PENDING" | "APPROVED" | "REJECTED"
  comments?: string
  createdAt: string
  approvedAt?: string
    teamLead?: {
    name: string
    clubName?: string
  }
    staff?: {
    name: string
    department?: string
  }
  request: {
    id: string
    date: string
    fromTime: string      // Fixed: fromTime instead of missing
    toTime: string        // Fixed: toTime instead of missing
    remarks: string       // Fixed: remarks instead of reason
    status: "PENDING" | "APPROVED" | "REJECTED"
    clubName: string
    createdAt: string
    student: {
      id: string
      name: string
      hostelName: string
      roomNo: string
      phoneNumber: string
      user: {
        email: string
        uid?: string
      }
    }
      approvals: Array<{
      id: string
      status: "PENDING" | "APPROVED" | "REJECTED"
      comments?: string
      createdAt: string
      teamLead?: {
        name: string
        clubName?: string
      }
      staff?: {
        name: string
        department?: string
      }
    }>
  }
}

const HostelApprovalsPage = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [approvals, setApprovals] = useState<StaybackApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedApproval, setSelectedApproval] = useState<StaybackApproval | null>(null)
  const [comments, setComments] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED" | null>(null)

  useEffect(() => {
    if (session?.user?.role !== "HOSTEL") {
      router.push("/unauthorized")
      return
    }
    fetchApprovals()
  }, [session, router])

  const fetchApprovals = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("🔄 Fetching hostel approvals...")
      const response = await fetch("/api/approvals")
      
      if (response.ok) {
        const data = await response.json()
        console.log("📋 Hostel approvals data:", data)
        setApprovals(Array.isArray(data) ? data : [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch approvals")
      }
    } catch (error) {
      console.error("❌ Error fetching approvals:", error)
      setError("An error occurred while fetching approvals")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovalAction = (approval: StaybackApproval, action: "APPROVED" | "REJECTED") => {
    setSelectedApproval(approval)
    setActionType(action)
    setComments("")
    setShowModal(true)
  }

  const submitApproval = async () => {
    if (!selectedApproval || !actionType) return

    setActionLoading(selectedApproval.id)
    
    try {
      const response = await fetch("/api/approvals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: selectedApproval.request.id,  // Use request.id
          status: actionType,
          comments: comments.trim() || undefined,
        }),
      })
      
      if (response.ok) {
        await fetchApprovals() // Refresh the list
        setShowModal(false)
        setSelectedApproval(null)
        setActionType(null)
        setComments("")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update approval")
      }
    } catch (error) {
      setError("An error occurred while updating approval")
    } finally {
      setActionLoading(null)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedApproval(null)
    setActionType(null)
    setComments("")
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default" // Green variant
      case "REJECTED":
        return "destructive" // Red variant
      case "PENDING":
        return "secondary" // Yellow variant
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const pendingApprovals = approvals.filter(a => a.status === "PENDING")
  const completedApprovals = approvals.filter(a => a.status !== "PENDING")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading approvals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Stayback Approvals</h1>
              <p className="text-muted-foreground">Review and approve stayback requests for your hostel</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchApprovals}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => router.push("/hostel")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-700">
                <strong>Debug:</strong> Found {approvals.length} approvals
              </p>
              {approvals.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Pending: {pendingApprovals.length}, Completed: {completedApprovals.length}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{completedApprovals.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button variant="destructive" size="sm" onClick={fetchApprovals} className="ml-auto">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Approvals with Accordion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          
          {pendingApprovals.length === 0 ? (
            <CardContent>
              <div className="text-center py-12 space-y-4">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-muted-foreground">No pending approvals.</p>
                  <p className="text-sm text-muted-foreground">New requests will appear here for your review.</p>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {pendingApprovals.map((approval) => (
                  <AccordionItem key={approval.id} value={approval.id} className="border-b">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{approval.request.student.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>Room {approval.request.student.roomNo}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span>{approval.request.clubName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusBadgeVariant(approval.status)}>
                            {approval.status}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {new Date(approval.request.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-6">
                        {/* Student Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="bg-muted/50">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Student Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">Room:</span> {approval.request.student.roomNo}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">Phone:</span> {approval.request.student.phoneNumber}
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">Club:</span> {approval.request.clubName}
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-muted/50">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Request Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">Date:</span> {new Date(approval.request.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">Time:</span> {approval.request.fromTime} - {approval.request.toTime}
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">Submitted:</span> {formatDate(approval.request.createdAt)}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Team Lead Approvals */}
                        {approval.request.approvals && approval.request.approvals.some(a => a.teamLead) && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <h4 className="font-medium">Team Lead Approvals:</h4>
                            </div>
                            <div className="grid gap-2">
                              {approval.request.approvals
                                .filter((teamApproval) => teamApproval.teamLead)
                                .map((teamApproval) => (
                                  <Card key={teamApproval.id} className="bg-muted/30">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Badge variant={getStatusBadgeVariant(teamApproval.status)} className="text-xs">
                                            {teamApproval.status}
                                          </Badge>
                                          <span className="text-sm font-medium">
                                            {teamApproval.teamLead?.name || "Team Lead"}
                                          </span>
                                        </div>
                                        {teamApproval.comments && (
                                          <p className="text-xs text-muted-foreground italic max-w-xs truncate">
                                            "{teamApproval.comments}"
                                          </p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Staff Approvals */}
                        {approval.request.approvals && approval.request.approvals.some(a => a.staff) && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <h4 className="font-medium">Staff Approvals:</h4>
                            </div>
                            <div className="grid gap-2">
                              {approval.request.approvals
                                .filter((teamApproval) => teamApproval.staff)
                                .map((teamApproval) => (
                                  <Card key={teamApproval.id} className="bg-muted/30">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Badge variant={getStatusBadgeVariant(teamApproval.status)} className="text-xs">
                                            {teamApproval.status}
                                          </Badge>
                                          <span className="text-sm font-medium">
                                            {teamApproval.staff?.name || "Staff"}
                                          </span>
                                        </div>
                                        {teamApproval.comments && (
                                          <p className="text-xs text-muted-foreground italic max-w-xs truncate">
                                            "{teamApproval.comments}"
                                          </p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Reason */}
                        <div className="space-y-2">
                          <h4 className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Reason for Stayback:
                          </h4>
                          <Card className="bg-muted/50">
                            <CardContent className="p-3">
                              <p className="text-sm">{approval.request.remarks}</p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                          <Button
                            onClick={() => handleApprovalAction(approval, "APPROVED")}
                            disabled={actionLoading === approval.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === approval.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleApprovalAction(approval, "REJECTED")}
                            disabled={actionLoading === approval.id}
                          >
                            {actionLoading === approval.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          )}
        </Card>

        {/* Completed Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed Approvals ({completedApprovals.length})
            </CardTitle>
          </CardHeader>
          
          {completedApprovals.length === 0 ? (
            <CardContent>
              <div className="text-center py-12 space-y-4">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-muted-foreground">No completed approvals yet.</p>
                  <p className="text-sm text-muted-foreground">Processed requests will appear here.</p>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Security Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Decision Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedApprovals.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{approval.request.student.name}</div>
                            <div className="text-sm text-muted-foreground">{approval.request.clubName}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{approval.request.student.roomNo}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{new Date(approval.request.date).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {approval.request.fromTime} - {approval.request.toTime}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {/* Security Status */}
                          {(() => {
                            // Extract all security updates from all approvals
                            const allSecurityUpdates: Array<{status: string, name: string, comment?: string}> = []
                            
                            approval.request.approvals?.forEach((teamApproval) => {
                              if (teamApproval.comments && teamApproval.comments.includes('[SECURITY UPDATE]')) {
                                const lines = teamApproval.comments.split('\n')
                                lines.forEach(line => {
                                  if (line.includes('[SECURITY UPDATE]')) {
                                    const match = line.match(/\[SECURITY UPDATE\] Student marked as (IN|OUT) by Security: ([^-]+)(?:-(.+))?/)
                                    if (match) {
                                      const [, status, securityName, additionalComment] = match
                                      allSecurityUpdates.push({
                                        status,
                                        name: securityName.trim(),
                                        comment: additionalComment?.trim()
                                      })
                                    }
                                  }
                                })
                              }
                            })
                            
                            // Get the latest security update (last one in the array)
                            const latestUpdate = allSecurityUpdates[allSecurityUpdates.length - 1]
                            
                            if (latestUpdate) {
                              const displayStatus = latestUpdate.status === 'IN' ? 'Present' : 'Absent'
                              return (
                                <div className="inline-flex items-center gap-2">
                                  <Badge variant={latestUpdate.status === 'IN' ? 'default' : 'destructive'} className={`text-xs ${
                                    latestUpdate.status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {displayStatus}
                                  </Badge>
                                </div>
                              )
                            } else {
                              return <span className="text-gray-400 text-sm">-</span>
                            }
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(approval.status)}>
                            {approval.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {approval.approvedAt ? formatDate(approval.approvedAt) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Approval Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "APPROVED" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve Request
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "APPROVED" 
                ? "Are you sure you want to approve this stayback request?" 
                : "Are you sure you want to reject this stayback request?"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedApproval && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Student:</span> {selectedApproval.request.student.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Room:</span> {selectedApproval.request.student.roomNo}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Club:</span> {selectedApproval.request.clubName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Date:</span> {new Date(selectedApproval.request.date).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Time:</span> {selectedApproval.request.fromTime} - {selectedApproval.request.toTime}
                </p>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="comments">
              Comments {actionType === "REJECTED" ? "(Required)" : "(Optional)"}
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder={
                actionType === "APPROVED" 
                  ? "Add any comments about the approval..." 
                  : "Please provide a reason for rejection..."
              }
            />
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeModal} disabled={!!actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={!!actionLoading || (actionType === "REJECTED" && !comments.trim())}
              className={actionType === "APPROVED" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={actionType === "APPROVED" ? "default" : "destructive"}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${actionType === "APPROVED" ? "Approval" : "Rejection"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HostelApprovalsPage
