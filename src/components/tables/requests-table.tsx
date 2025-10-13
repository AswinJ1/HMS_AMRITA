// components/tables/requests-table.tsx

"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"

interface Approval {
  id: string
  status: string
  comments?: string
  approverType: string
  staff?: { name: string }
  hostel?: { name: string }
  teamLead?: { name: string }
}

interface StaybackRequest {
  id: string
  clubName: string
  date: string
  fromTime: string
  toTime: string
  remarks: string
  status: string
  createdAt: string
  approvals: Approval[]
}

export function RequestsTable() {
  const [requests, setRequests] = useState<StaybackRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    fetchRequests()
  }, [])
  
  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/stayback")
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error("Error fetching requests:", error)
    } finally {
      setIsLoading(false)
    }
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
  
  // Calculate the actual status based on all approvals
  const getActualStatus = (request: StaybackRequest) => {
    if (request.approvals.length === 0) return "PENDING"
    
    // Check if any approval is rejected
    const hasRejected = request.approvals.some(a => a.status === "REJECTED")
    if (hasRejected) return "REJECTED"
    
    // Check if all approvals are approved
    const allApproved = request.approvals.every(a => a.status === "APPROVED")
    if (allApproved && request.approvals.length >= 3) return "APPROVED"
    
    // Otherwise, it's still pending
    return "PENDING"
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg">No stayback requests found</p>
        <p className="text-sm mt-2">Submit a new request to get started</p>
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Club
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Approvals
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {requests.map((request) => {
            const actualStatus = getActualStatus(request)
            
            return (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(request.date), "MMM dd, yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span className="font-medium">{request.fromTime}</span>
                    <span className="text-xs text-gray-500">to {request.toTime}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="font-medium">{request.clubName}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="truncate" title={request.remarks}>
                    {request.remarks}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(actualStatus)}`}>
                    {actualStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="space-y-2">
                    {request.approvals.map((approval) => {
                      const approverName = approval.staff?.name || 
                                         approval.hostel?.name || 
                                         approval.teamLead?.name || "Unknown"
                      const approverType = approval.approverType || 
                                         (approval.staff ? "STAFF" :
                                         approval.hostel ? "HOSTEL" :
                                         approval.teamLead ? "TEAMLEAD" : "UNKNOWN")
                      
                      const typeLabel = approverType === "STAFF" ? "Staff" :
                                       approverType === "HOSTEL" ? "Hostel" :
                                       approverType === "TEAMLEAD" ? "Team Lead" : "Unknown"
                      
                      return (
                        <div key={approval.id} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700 min-w-[80px]">
                            {typeLabel}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">{approverName}</span>
                            <span className={`px-2 py-1 rounded-full font-semibold ${getStatusBadgeColor(approval.status)}`}>
                              {approval.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Show pending approvers */}
                    {request.approvals.length < 3 && (
                      <div className="text-xs text-gray-500 italic mt-2">
                        Waiting for {3 - request.approvals.length} more approval(s)
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}