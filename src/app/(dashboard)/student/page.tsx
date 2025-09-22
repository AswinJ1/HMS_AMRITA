// app/(dashboard)/student/page.tsx

"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function StudentDashboard() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {session?.user?.name || "Student"}
            </span>
            <Button
              variant="destructive"
              onClick={() => signOut()}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stayback Card */}
          <Card  className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href="/student/stayback">
              <CardHeader>
                <CardTitle>New Stayback Request</CardTitle>
                <CardDescription>
                  Submit a new stayback request for approval
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          {/* Requests Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <Link href="/student/requests">
              <CardHeader>
                <CardTitle>My Requests</CardTitle>
                <CardDescription>
                  View all your stayback requests and their status
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}
