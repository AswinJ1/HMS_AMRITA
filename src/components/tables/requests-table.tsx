// components/tables/requests-table.tsx

"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"

interface Approval {
  id: string
  status: string
  comments?: string
  staff?: { name: string }
  hostel?: { name: string }
  teamLead?: { name: string }
}

interface StaybackRequest {
  id: string
  clubName: string
  date: string
  time: string
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
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }
  
  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }
  
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No stayback requests found
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto">
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
          {requests.map((request) => (
            <tr key={request.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(request.date), "MMM dd, yyyy")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.time}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.clubName}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                {request.remarks}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(request.status)}`}>
                  {request.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="space-y-1">
                  {request.approvals.map((approval) => {
                    const approverName = approval.staff?.name || 
                                       approval.hostel?.name || 
                                       approval.teamLead?.name || "Unknown"
                    const approverType = approval.staff ? "Staff" :
                                       approval.hostel ? "Hostel" :
                                       approval.teamLead ? "Team Lead" : ""
                    
                    return (
                      <div key={approval.id} className="text-xs">
                        <span className="font-medium">{approverType}:</span>{" "}
                        <span className={`px-1 py-0.5 rounded ${getStatusBadgeColor(approval.status)}`}>
                          {approval.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}