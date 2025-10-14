// app/(dashboard)/student/page.tsx

"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User, FileText, ClipboardList, LogOut } from "lucide-react"
import { useEffect, useState } from "react"

interface StudentProfile {
  id: string
  email: string
  uid: string
  role: string
  student: {
    id: string
    name: string
    department: string
    year: string
    phoneNumber: string
    hostelName: string
    roomNo: string
    clubName: string
    gender: "male" | "female"
    avatarUrl?: string
  }
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)

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
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {/* <Link href="/student/profile"> */}
                <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300 transition-all">
                  {profile?.student?.avatarUrl ? (
                    <AvatarImage src={profile.student.avatarUrl} alt={profile.student.name} />
                  ) : (
                    <AvatarFallback className="bg-blue-600 text-white">
                      {loading ? "..." : profile?.student?.name ? getInitials(profile.student.name) : "ST"}
                    </AvatarFallback>
                  )}
                </Avatar>
              {/* </Link> */}
              
              {/* Name and Role */}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {loading ? "Loading..." : profile?.student?.name || session?.user?.name || "Student"}
                </h1>
                <p className="text-sm text-gray-600">
                  {profile?.student?.department || "Student Dashboard"}
                </p>
              </div>
            </div>

            {/* Profile and Logout Buttons */}
            <div className="flex items-center gap-3">
              {/* <Link href="/student/profile">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link> */}
              {/* <Button
                variant="destructive"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.student?.name?.split(" ")[0] || "Student"}! 👋
          </h2>
          <p className="text-gray-600">
            Manage your stayback requests and view your profile information.
          </p>
        </div>

        {/* Quick Stats */}
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Hostel</CardDescription>
                <CardTitle className="text-2xl">{profile.student.hostelName}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Room Number</CardDescription>
                <CardTitle className="text-2xl">{profile.student.roomNo}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Club</CardDescription>
                <CardTitle className="text-2xl">{profile.student.clubName}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Action Cards */}
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stayback Card */}
          <Link href="/student/stayback">
            <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>New Stayback Request</CardTitle>
                </div>
                {/* <CardDescription>
                  Submit a new stayback request for approval
                </CardDescription> */}
              </CardHeader>
            </Card>
          </Link>

          {/* Requests Card */}
          <Link href="/student/requests">
            <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-green-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ClipboardList className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>My Requests</CardTitle>
                </div>
                {/* <CardDescription>
                  View all your stayback requests and their status
                </CardDescription> */}
              </CardHeader>
            </Card>
          </Link>

          {/* Profile Card */}
          <Link href="/student/profile">
            <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-purple-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>My Profile</CardTitle>
                </div>
                {/* <CardDescription>
                  View and manage your student profile
                </CardDescription> */}
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
