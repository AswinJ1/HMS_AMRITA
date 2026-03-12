"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowRight, ChevronLeft } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Dropdown options fetched from DB
  const [clubOptions, setClubOptions] = useState<string[]>([])
  const [hostelOptions, setHostelOptions] = useState<string[]>([])

  const [form, setForm] = useState({
    name: "",
    email: "",
    uid: "",
    password: "",
    confirmPassword: "",
    clubName: "",
    hostelName: "",
    roomNo: "",
    phoneNumber: "",
  })

  // Fetch available clubs & hostels on mount
  useEffect(() => {
    fetch("/api/auth/options")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.clubs)) setClubOptions(data.clubs)
        if (Array.isArray(data.hostels)) setHostelOptions(data.hostels)
      })
      .catch(() => {})
  }, [])

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear the field error when user edits
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {}
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address"
    if (!/^[A-Za-z0-9.]{5,25}$/.test(form.uid)) errs.uid = "UID must be 5–25 characters (letters, numbers, and dots)"
    if (form.password.length < 6) errs.password = "Password must be at least 6 characters"
    else if (!/[A-Z]/.test(form.password)) errs.password = "Password must contain at least one uppercase letter"
    else if (!/[0-9]/.test(form.password)) errs.password = "Password must contain at least one number"
    if (form.confirmPassword !== form.password) errs.confirmPassword = "Passwords do not match"
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {}
    if (!form.clubName) errs.clubName = "Please select a club"
    if (!form.hostelName) errs.hostelName = "Please select a hostel"
    if (!form.roomNo.trim()) errs.roomNo = "Room number is required"
    if (!/^[0-9]{10}$/.test(form.phoneNumber)) errs.phoneNumber = "Phone number must be exactly 10 digits"
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function goToStep2(e: React.FormEvent) {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!validateStep2()) return

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, uid: form.uid.toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Registration failed")
      router.push("/login")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const step1Fields = [
    { id: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
    { id: "email", label: "Email Address", type: "email", placeholder: "you@amrita.edu" },
    { id: "uid", label: "University ID", type: "text", placeholder: "AM.EN.U4XXX" },
    { id: "password", label: "Password", type: "password", placeholder: "Min 6 characters" },
    { id: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Re-enter password" },
  ]

  const step2InputFields = [
    { id: "roomNo", label: "Room Number", type: "text", placeholder: "e.g. 302" },
    { id: "phoneNumber", label: "Phone Number", type: "text", placeholder: "10-digit number" },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-3xl">
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

        {/* Steps indicator */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-foreground" : "text-muted-foreground"}`}>
            <div className={`flex size-7 items-center justify-center text-xs font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
            <span className="text-sm font-medium">Account</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-foreground" : "text-muted-foreground"}`}>
            <div className={`flex size-7 items-center justify-center text-xs font-bold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
            <span className="text-sm font-medium">Details</span>
          </div>
        </div>

        {/* Card */}
        <div className="border bg-card p-8 shadow-sm sm:p-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">
              {step === 1 ? "Create your account" : "Personal details"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 1 ? "Step 1 of 2 — Set up your credentials" : "Step 2 of 2 — Hostel and club information"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={step === 2 ? onSubmit : goToStep2} className="space-y-5">
            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                  <Input id="name" type="text" placeholder="John Doe" value={form.name} onChange={(e) => update("name", e.target.value)} required className={`h-11 text-sm ${fieldErrors.name ? "border-destructive" : ""}`} />
                  {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
                </div>
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@amrita.edu" value={form.email} onChange={(e) => update("email", e.target.value)} required className={`h-11 text-sm ${fieldErrors.email ? "border-destructive" : ""}`} />
                  {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                </div>
                {/* UID — full width */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="uid" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">University ID</Label>
                  <Input id="uid" type="text" placeholder="AM.EN.U4XXX" value={form.uid} onChange={(e) => update("uid", e.target.value)} required className={`h-11 text-sm ${fieldErrors.uid ? "border-destructive" : ""}`} />
                  {fieldErrors.uid && <p className="text-xs text-destructive">{fieldErrors.uid}</p>}
                </div>
                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                  <Input id="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => update("password", e.target.value)} required className={`h-11 text-sm ${fieldErrors.password ? "border-destructive" : ""}`} />
                  {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
                </div>
                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required className={`h-11 text-sm ${fieldErrors.confirmPassword ? "border-destructive" : ""}`} />
                  {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Club Name Dropdown */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Club / Team
                  </Label>
                  {clubOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground border border-dashed px-3 py-2.5 rounded">No clubs available yet. Contact the admin.</p>
                  ) : (
                    <Select value={form.clubName} onValueChange={(v) => update("clubName", v)}>
                      <SelectTrigger className={`h-11 text-sm ${fieldErrors.clubName ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="Select your club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubOptions.map((club) => (
                          <SelectItem key={club} value={club}>
                            {club}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {fieldErrors.clubName && <p className="text-xs text-destructive">{fieldErrors.clubName}</p>}
                </div>

                {/* Hostel Name Dropdown */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hostel
                  </Label>
                  {hostelOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground border border-dashed px-3 py-2.5 rounded">No hostels available yet. Contact the admin.</p>
                  ) : (
                    <Select value={form.hostelName} onValueChange={(v) => update("hostelName", v)}>
                      <SelectTrigger className={`h-11 text-sm ${fieldErrors.hostelName ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="Select your hostel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostelOptions.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {fieldErrors.hostelName && <p className="text-xs text-destructive">{fieldErrors.hostelName}</p>}
                  <p className="text-[11px] text-muted-foreground">Choose carefully — only an admin can change this later.</p>
                </div>

                {/* Room & Phone — regular inputs */}
                {step2InputFields.map((f) => (
                  <div key={f.id} className="space-y-2">
                    <Label htmlFor={f.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {f.label}
                    </Label>
                    <Input
                      id={f.id}
                      type={f.type}
                      placeholder={f.placeholder}
                      value={(form as any)[f.id]}
                      onChange={(e) => update(f.id, e.target.value)}
                      required
                      className={`h-11 text-sm ${fieldErrors[f.id] ? "border-destructive" : ""}`}
                    />
                    {fieldErrors[f.id] && <p className="text-xs text-destructive">{fieldErrors[f.id]}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              {step === 2 && (
                <Button type="button" variant="outline" className="h-11" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-1 size-4" />
                  Back
                </Button>
              )}
              <Button type="submit" className="h-11 flex-1 text-sm font-semibold" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 size-4" />
                )}
                {step === 1 ? "Continue" : "Create Account"}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
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
