"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowRight } from "lucide-react"

const roleRedirects: Record<string, string> = {
  ADMIN: "/admin",
  STAFF: "/staff",
  STUDENT: "/student",
  TEAM_LEAD: "/team-lead",
  HOSTEL: "/hostel",
  SECURITY: "/security",
}

export function LoginForm() {
  const router = useRouter()
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const [uid, setUid] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const needsUid = ["STAFF", "HOSTEL", "TEAM_LEAD", "SECURITY"].includes(role)
  const needsEmail = ["ADMIN", "STUDENT", "STAFF", "HOSTEL", "TEAM_LEAD", "SECURITY"].includes(role)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email || undefined,
        uid: uid || undefined,
        password,
        role,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push(roleRedirects[role] || "/")
        router.refresh()
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo & Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Amrita Logo"
            width={72}
            height={72}
            className="mb-4"
            priority
          />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            HMS Amrita
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hostel Stayback Management System
          </p>
        </div>

        {/* Card */}
        <div className="border bg-card p-8 shadow-sm sm:p-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your role and enter your credentials
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="h-11 text-sm">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="HOSTEL">Hostel Warden</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* UID */}
            {needsUid && (
              <div className="space-y-2">
                <Label htmlFor="uid" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  UID
                </Label>
                <Input
                  id="uid"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Enter your UID"
                  className="h-11 text-sm"
                  required
                />
              </div>
            )}

            {/* Email */}
            {needsEmail && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@amrita.edu"
                  className="h-11 text-sm"
                  required
                />
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-11 text-sm"
                required
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-sm font-semibold"
              disabled={loading || !role}
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 size-4" />
              )}
              Sign in
            </Button>
          </form>

          <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
            New student?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          &copy; {new Date().getFullYear()} Amrita Vishwa Vidyapeetham. All rights reserved.
        </p>
      </div>
    </div>
  )
}
