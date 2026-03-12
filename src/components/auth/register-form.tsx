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
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

          <form onSubmit={step === 2 ? onSubmit : (e) => { e.preventDefault(); setStep(2) }} className="space-y-5">
            {step === 1 && step1Fields.map((f) => (
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
                  className="h-11 text-sm"
                />
              </div>
            ))}

            {step === 2 && (
              <>
                {/* Club Name Dropdown */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Club / Team
                  </Label>
                  <Select value={form.clubName} onValueChange={(v) => update("clubName", v)}>
                    <SelectTrigger className="h-11 text-sm">
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
                </div>

                {/* Hostel Name Dropdown */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hostel
                  </Label>
                  <Select value={form.hostelName} onValueChange={(v) => update("hostelName", v)}>
                    <SelectTrigger className="h-11 text-sm">
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
                      className="h-11 text-sm"
                    />
                  </div>
                ))}
              </>
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
