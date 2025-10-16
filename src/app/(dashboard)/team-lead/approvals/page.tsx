"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface StaybackApproval {
  id: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  comments?: string
  createdAt: string
  approvedAt?: string
  request: {
    id: string
    date: string
    reason: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    clubName: string
    createdAt: string
    student: {
      id: string
      name: string
      hostelName: string
      roomNo: string
      phoneNumber: string
    }
  }
}

const TeamLeadApprovalsPage = () => {
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
    if (session?.user?.role !== "TEAM_LEAD") {
      router.push("/unauthorized")
      return
    }
    fetchApprovals()
  }, [session, router])

  const fetchApprovals = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/approvals")
      
      if (response.ok) {
        const data = await response.json()
        setApprovals(data)
      } else {
        setError("Failed to fetch approvals")
      }
    } catch (error) {
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
          requestId: selectedApproval.request.id,
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approvals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Lead Approvals</h1>
              <p className="text-gray-600 mt-1">Review and approve stayback requests for your club members</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchApprovals}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Refresh
              </button>
              <button
                onClick={() => router.push("/team-lead")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
                <p className="text-2xl font-bold text-gray-900">{approvals.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
                <p className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                <p className="text-2xl font-bold text-blue-600">{completedApprovals.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Pending Approvals ({pendingApprovals.length})
            </h3>
          </div>
          
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 mt-2">No pending approvals.</p>
              <p className="text-gray-400 text-sm">New requests from your club members will appear here for your review.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {approval.request.student.name}
                          </h4>
                          <p className="text-sm text-orange-600 font-medium">
                            Club Member - {approval.request.clubName}
                          </p>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                            approval.status
                          )}`}
                        >
                          {approval.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Hostel:</span> {approval.request.student.hostelName}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Room:</span> {approval.request.student.roomNo}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Phone:</span> {approval.request.student.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Stayback Date:</span> {new Date(approval.request.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Submitted:</span> {formatDate(approval.request.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Reason for Stayback:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {approval.request.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprovalAction(approval, "APPROVED")}
                      disabled={actionLoading === approval.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading === approval.id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleApprovalAction(approval, "REJECTED")}
                      disabled={actionLoading === approval.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading === approval.id ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Approvals */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Completed Approvals ({completedApprovals.length})
            </h3>
          </div>
          
          {completedApprovals.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-gray-500 mt-2">No completed approvals yet.</p>
              <p className="text-gray-400 text-sm">Processed requests will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hostel & Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Security Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Decision Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedApprovals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {approval.request.student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {approval.request.clubName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{approval.request.student.hostelName}</div>
                        <div className="text-gray-500">Room {approval.request.student.roomNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(approval.request.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                            approval.status
                          )}`}
                        >
                          {approval.status}
                        </span>
                      </td>
                      
                      {/* Security Status Column - Show only latest status */}
                      <td className="px-6 py-4">
                        {(() => {
                          // Extract latest security update from comments
                          if (approval.comments && approval.comments.includes('[SECURITY UPDATE]')) {
                            const lines = approval.comments.split('\n')
                            const securityUpdates: Array<{status: string}> = []
                            
                            lines.forEach(line => {
                              if (line.includes('[SECURITY UPDATE]')) {
                                const match = line.match(/\[SECURITY UPDATE\] Student marked as (IN|OUT)/)
                                if (match) {
                                  securityUpdates.push({ status: match[1] })
                                }
                              }
                            })
                            
                            // Get the latest security update
                            const latestUpdate = securityUpdates[securityUpdates.length - 1]
                            
                            if (latestUpdate) {
                              const displayStatus = latestUpdate.status === 'IN' ? 'Present' : 'Absent'
                              return (
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  latestUpdate.status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {displayStatus}
                                </span>
                              )
                            }
                          }
                          
                          return <span className="text-xs text-gray-400">-</span>
                        })()}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {approval.approvedAt ? formatDate(approval.approvedAt) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showModal && selectedApproval && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {actionType === "APPROVED" ? "Approve" : "Reject"} Request
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Student:</span> {selectedApproval.request.student.name}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Club:</span> {selectedApproval.request.clubName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Hostel:</span> {selectedApproval.request.student.hostelName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Room:</span> {selectedApproval.request.student.roomNo}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {new Date(selectedApproval.request.date).toLocaleDateString()}
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                  Team Lead Comments {actionType === "REJECTED" ? "(Required)" : "(Optional)"}
                </label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={
                    actionType === "APPROVED" 
                      ? "Add any comments about the approval..." 
                      : "Please provide a reason for rejection..."
                  }
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={submitApproval}
                  disabled={!!actionLoading || (actionType === "REJECTED" && !comments.trim())}
                  className={`flex-1 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    actionType === "APPROVED"
                      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  }`}
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    `Confirm ${actionType === "APPROVED" ? "Approval" : "Rejection"}`
                  )}
                </button>
                <button
                  onClick={closeModal}
                  disabled={!!actionLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamLeadApprovalsPage