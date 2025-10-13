"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, User, Mail, GraduationCap, Phone, Home, Users, Building2, MapPin } from "lucide-react"

interface StudentProfile {
  id: string
  email: string
  uid: string
  student: {
    name: string
    phoneNumber: string
    hostelName: string
    roomNo: string
    clubName: string
  }
}

export default function StudentEditProfile() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    hostelName: "",
    roomNo: "",
    clubName: "",
    email: "",
    uid: "",
  })

  useEffect(() => {
    if (!session?.user || (session.user.role as string) !== "STUDENT") {
      router.push("/unauthorized")
      return
    }
    fetchProfile()
  }, [session, router])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/profile")
      
      if (response.ok) {
        const currentUser = await response.json() as StudentProfile
        
        setFormData({
          name: currentUser.student.name,
          phoneNumber: currentUser.student.phoneNumber || "",
          hostelName: currentUser.student.hostelName || "",
          roomNo: currentUser.student.roomNo || "",
          clubName: currentUser.student.clubName || "",
          email: currentUser.email,
          uid: currentUser.uid,
        })
      } else {
        setError("Failed to load profile")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    // Validate phoneNumber number if provided
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      setError("Phone number must be 10 digits")
      setIsSaving(false)
      return
    }

    try {
      const updateData = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        hostelName: formData.hostelName,
        roomNo: formData.roomNo,
        clubName: formData.clubName,
      }

      console.log("Sending update request:", updateData)

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()
      console.log("Response:", response.status, data)

      if (response.ok) {
        setSuccess("Profile updated successfully!")
        
        // Update session if name changed
        await update()
        
        // Refresh profile data
        await fetchProfile()
        
        // Redirect back to profile page after 2 seconds
        setTimeout(() => {
          router.push("/student/profile")
        }, 2000)
      } else {
        setError(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("An error occurred while updating profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Edit Profile
          </h1>
          <p className="text-gray-600 mt-2">Update your student profile information</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="pl-10 bg-gray-50"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact admin if needed.
                </p>
              </div>

              <div>
                <Label htmlFor="uid">UID</Label>
                <Input
                  id="uid"
                  name="uid"
                  value={formData.uid}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  UID cannot be changed. Contact admin if needed.
                </p>
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your 10-digit phoneNumber number"
                    className="pl-10"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter a valid 10-digit phoneNumber number
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
              <CardDescription>
                Update your academic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          

              <div>
                <Label htmlFor="clubName">clubName</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="clubName"
                    name="clubName"
                    value={formData.clubName}
                    onChange={handleInputChange}
                    placeholder="Enter your clubName name (optional)"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* hostelName Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                hostelName Information
              </CardTitle>
              <CardDescription>
                Update your accommodation details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hostelName">hostelName Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="hostelName"
                    name="hostelName"
                    value={formData.hostelName}
                    onChange={handleInputChange}
                    placeholder="Enter your hostelName name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="roomNo">Room Number</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="roomNo"
                    name="roomNo"
                    value={formData.roomNo}
                    onChange={handleInputChange}
                    placeholder="Enter your room number"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}