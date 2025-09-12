"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Student {
  id: string
  name: string
  clubName: string
  hostelName: string
  roomNo: string
  phoneNumber: string
  isTeamLead: boolean
  user: {
    id: string
    email: string
    uid?: string
    role: string
  }
}

interface TeamLead {
  id: string
  name: string
  clubName: string
  department?: string
  user: {
    id: string
    email: string
    uid?: string
    role: string
  }
}

interface User {
  id: string
  email: string
  uid?: string
  role: string
  student?: Student
  teamLead?: TeamLead
}

const TeamLeadsPage = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [promoteLoading, setPromoteLoading] = useState<string | null>(null)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [promoteForm, setPromoteForm] = useState({
    clubName: "",
    department: "",
  })
  const [activeTab, setActiveTab] = useState<"students" | "teamleads">("students")

  useEffect(() => {
    if (session?.user?.role !== "STAFF") {
      router.push("/unauthorized")
      return
    }
    fetchUsers()
  }, [session, router])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/users")
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError("Failed to fetch users")
      }
    } catch (error) {
      setError("An error occurred while fetching users")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromoteStudent = (student: Student) => {
    setSelectedStudent(student)
    setPromoteForm({
      clubName: student.clubName || "",
      department: "",
    })
    setShowPromoteModal(true)
  }

  const submitPromotion = async () => {
    if (!selectedStudent || !promoteForm.clubName.trim()) return

    setPromoteLoading(selectedStudent.id)
    
    try {
      const response = await fetch("/api/users/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          clubName: promoteForm.clubName.trim(),
          department: promoteForm.department.trim() || undefined,
        }),
      })
      
      if (response.ok) {
        await fetchUsers() // Refresh the list
        setShowPromoteModal(false)
        setSelectedStudent(null)
        setPromoteForm({ clubName: "", department: "" })
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to promote student")
      }
    } catch (error) {
      setError("An error occurred while promoting student")
    } finally {
      setPromoteLoading(null)
    }
  }

  const closeModal = () => {
    setShowPromoteModal(false)
    setSelectedStudent(null)
    setPromoteForm({ clubName: "", department: "" })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "bg-green-100 text-green-800"
      case "TEAM_LEAD":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const students = users.filter(user => user.role === "STUDENT" && user.student)
  const teamLeads = users.filter(user => user.role === "TEAM_LEAD" && user.teamLead)
  const regularStudents = students.filter(user => !user.student?.isTeamLead)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Team Lead Management</h1>
              <p className="text-gray-600 mt-1">Manage students and promote them to team leads</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchUsers}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Refresh
              </button>
              <button
                onClick={() => router.push("/staff")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Current Team Leads</h3>
            <p className="text-2xl font-bold text-orange-600">{teamLeads.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Available for Promotion</h3>
            <p className="text-2xl font-bold text-green-600">{regularStudents.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab("students")}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "students"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Students ({regularStudents.length})
              </button>
              <button
                onClick={() => setActiveTab("teamleads")}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "teamleads"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Team Leads ({teamLeads.length})
              </button>
            </nav>
          </div>

          {/* Students Tab */}
          {activeTab === "students" && (
            <div className="p-6">
              {regularStudents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <p className="text-gray-500 mt-2">No students available for promotion.</p>
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
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hostel & Room
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Club
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {regularStudents.map((user) => {
                        const student = user.student!
                        return (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id.slice(0, 8)}...
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email}</div>
                              <div className="text-sm text-gray-500">{student.phoneNumber}</div>
                              {user.uid && (
                                <div className="text-sm text-gray-500">UID: {user.uid}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.hostelName}</div>
                              <div className="text-sm text-gray-500">Room {student.roomNo}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.clubName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                                  user.role
                                )}`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handlePromoteStudent(student)}
                                disabled={promoteLoading === student.id}
                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                              >
                                {promoteLoading === student.id ? "Promoting..." : "Promote to Team Lead"}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Team Leads Tab */}
          {activeTab === "teamleads" && (
            <div className="p-6">
              {teamLeads.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <p className="text-gray-500 mt-2">No team leads found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team Lead
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Club
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teamLeads.map((user) => {
                        const teamLead = user.teamLead!
                        return (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {teamLead.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id.slice(0, 8)}...
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email}</div>
                              {user.uid && (
                                <div className="text-sm text-gray-500">UID: {user.uid}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {teamLead.clubName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {teamLead.department || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                                  user.role
                                )}`}
                              >
                                {user.role}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Promote Modal */}
      {showPromoteModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Promote to Team Lead
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
                  <span className="font-medium">Student:</span> {selectedStudent.name}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Current Club:</span> {selectedStudent.clubName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Hostel:</span> {selectedStudent.hostelName} - Room {selectedStudent.roomNo}
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="clubName" className="block text-sm font-medium text-gray-700 mb-2">
                  Club Name *
                </label>
                <input
                  type="text"
                  id="clubName"
                  value={promoteForm.clubName}
                  onChange={(e) => setPromoteForm({ ...promoteForm, clubName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter club name"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  id="department"
                  value={promoteForm.department}
                  onChange={(e) => setPromoteForm({ ...promoteForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter department"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={submitPromotion}
                  disabled={!!promoteLoading || !promoteForm.clubName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {promoteLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Promoting...
                    </div>
                  ) : (
                    "Promote to Team Lead"
                  )}
                </button>
                <button
                  onClick={closeModal}
                  disabled={!!promoteLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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

export default TeamLeadsPage