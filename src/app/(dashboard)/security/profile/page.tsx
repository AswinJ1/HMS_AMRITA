"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2,
  Shield,
  Mail,
  User,
  Building2,
  Calendar,
  Save,
  IdCard,
  Lock,
} from "lucide-react"
import { AvatarSelector } from "@/components/avatar-selector"


interface SecurityProfile {
  id: string
  email: string
  uid: string
  role: string
  createdAt: string
  security: {
    id: string
    name: string
    department: string | null
    gender: string
    createdAt: string
    gender: "male" | "female"
    avatarUrl?: string
  }
}

export default function SecurityProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<SecurityProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ name: "", department: "", currentPassword: "", newPassword: "" })

  useEffect(() => {
    if (!session?.user) return
    if ((session.user.role as string) !== "SECURITY") {
      router.push("/unauthorized")
      return
    }
    fetchProfile()
  }, [session, router])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setForm({
          name: data.security?.name || "",
          department: data.security?.department || "",
          currentPassword: "",
          newPassword: "",
        })
      } else setError("Failed to load profile")
    } catch { setError("An error occurred") }
    finally { setIsLoading(false) }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          department: form.department,
          ...(form.newPassword && { currentPassword: form.currentPassword, newPassword: form.newPassword }),
        }),
      })
      if (res.ok) {
        toast.success("Profile updated")
        setEditMode(false)
        await fetchProfile()
      } else {
        const data = await res.json()
        toast.error(data.error || "Update failed")
      }
    } catch { toast.error("An error occurred") }
    finally { setIsSaving(false) }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error || "Profile not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sec = profile.security

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground">View and manage your security profile</p>
        </div>
        {!editMode ? (
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-3 animate-spin" />}
              <Save className="mr-1.5 size-3" /> Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="mb-4 size-20">
                <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                  {getInitials(sec.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{sec.name}</h2>
              <Badge className="mt-2" variant="secondary">
                <Shield className="mr-1 size-3" />
                Security
              </Badge>
              <Separator className="my-4 w-full" />
              <div className="w-full space-y-3 text-left text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="size-4 shrink-0" />
                  <span>{profile.uid}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-4 shrink-0" />
                  <span>{sec.department || "—"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
              <CardDescription>Your security personnel information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField icon={<User className="size-4" />} label="Full Name" value={sec.name} />
                <InfoField icon={<Building2 className="size-4" />} label="Department" value={sec.department || "—"} />
                <InfoField icon={<User className="size-4" />} label="Gender" value={sec.gender} />
                <InfoField icon={<Mail className="size-4" />} label="Email" value={profile.email} />
              </div>
            </CardContent>
          </Card>

          {editMode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Edit Information</CardTitle>
                <CardDescription>Update your details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept">Department</Label>
                    <Input id="dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1.5"><Lock className="size-3.5" /> Change Password</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="curpass">Current Password</Label>
                      <Input id="curpass" type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newpass">New Password</Label>
                      <Input id="newpass" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField icon={<Calendar className="size-4" />} label="Member Since" value={formatDate(profile.createdAt)} />
                <InfoField icon={<Calendar className="size-4" />} label="Profile Created" value={formatDate(sec.createdAt)} />
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Status</p>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">Active</Badge>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Role</p>
                  <Badge variant="outline">{profile.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{icon}{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}