"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface StaffOption { id: string; name: string; department?: string }
interface HostelOption { id: string; name: string; hostelName?: string }
interface TeamLeadOption { id: string; name: string; clubName?: string }
interface Profile { clubName?: string; hostelName?: string }

export default function StaybackForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = session?.user?.role
  const isStudent = role === "STUDENT"

  const [staffList, setStaffList] = useState<StaffOption[]>([])
  const [hostelList, setHostelList] = useState<HostelOption[]>([])
  const [teamLeadList, setTeamLeadList] = useState<TeamLeadOption[]>([])
  const [profile, setProfile] = useState<Profile>({})
  const [loading, setLoading] = useState(false)

  // Form state
  const [selectedDate, setSelectedDate] = useState("")
  const [fromTime, setFromTime] = useState("")
  const [toTime, setToTime] = useState("")
  const [remarks, setRemarks] = useState("")
  const [staffId, setStaffId] = useState("")
  const [hostelId, setHostelId] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  /* ── Fetch user profile to get clubName & hostelName ── */
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (isStudent && data.student) {
          setProfile({ clubName: data.student.clubName, hostelName: data.student.hostelName })
        } else if (!isStudent && data.teamLead) {
          // Team lead was promoted from a student — get hostelName from the student record
          setProfile({ clubName: data.teamLead.clubName, hostelName: data.student?.hostelName })
        }
      })
      .catch(() => {})
  }, [isStudent])

  /* ── Fetch staff, hostel wardens, and team leads ── */
  useEffect(() => {
    Promise.all([
      fetch("/api/staff/list").then((r) => r.json()),
      fetch("/api/hostel/list").then((r) => r.json()),
      isStudent ? fetch("/api/teamlead/list").then((r) => r.json()) : Promise.resolve([]),
    ]).then(([staff, hostel, tl]) => {
      setStaffList(Array.isArray(staff) ? staff : [])
      setHostelList(Array.isArray(hostel) ? hostel : [])
      if (isStudent) setTeamLeadList(Array.isArray(tl) ? tl : [])
    })
  }, [isStudent])

  /* ── Auto-match team lead from student's registered club ── */
  const matchedTeamLead = useMemo(() => {
    if (!isStudent || !profile.clubName || teamLeadList.length === 0) return null
    return teamLeadList.find(
      (tl) => tl.clubName?.toLowerCase() === profile.clubName?.toLowerCase()
    ) || null
  }, [isStudent, profile.clubName, teamLeadList])

  /* ── Auto-match hostel warden from student's registered hostel ── */
  const matchedWarden = useMemo(() => {
    if (!profile.hostelName || hostelList.length === 0) return null
    return hostelList.find(
      (h) => h.hostelName?.toLowerCase() === profile.hostelName?.toLowerCase()
    ) || null
  }, [profile.hostelName, hostelList])

  // Set hostelId when warden is matched
  useEffect(() => {
    if (matchedWarden) setHostelId(matchedWarden.id)
  }, [matchedWarden])

  /* ── Validate + Submit ── */
  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!selectedDate) errs.date = "Date is required"
    const timeRe = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRe.test(fromTime)) errs.fromTime = "Enter valid time (HH:MM)"
    if (!timeRe.test(toTime)) errs.toTime = "Enter valid time (HH:MM)"
    if (remarks.trim().length < 10) errs.remarks = "At least 10 characters"
    if (!staffId) errs.staffId = "Select a staff member"
    if (!hostelId && !matchedWarden) errs.hostelId = "Hostel warden is required"
    if (isStudent && !matchedTeamLead) errs.teamLeadId = "No team lead found for your club"
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        clubName: profile.clubName || "",
        date: new Date(selectedDate).toISOString(),
        fromTime,
        toTime,
        remarks,
        staffId,
        hostelId: matchedWarden ? matchedWarden.id : hostelId,
      }

      if (isStudent) {
        body.teamLeadId = matchedTeamLead?.id
        body.applicantType = "student"
      } else {
        body.applicantType = "team_lead"
      }

      const res = await fetch("/api/stayback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || "Failed")

      toast.success("Stayback request submitted successfully")
      if (isStudent) router.push("/student/requests")
      else router.push("/team-lead/requests")
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">New Stayback Request</CardTitle>
        <CardDescription>
          {isStudent
            ? "Your request will go through Team Lead → Staff → Warden for approval."
            : "Your request will go through Staff → Warden for approval."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">

            {/* ── Club / Team (locked from profile) ── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Club / Team</Label>
              <Input value={profile.clubName || "Loading..."} disabled className="bg-muted" />
            </div>

            {/* ── Date ── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setFormErrors((prev) => { const n = { ...prev }; delete n.date; return n })
                }}
              />
              {formErrors.date && <p className="text-xs text-destructive">{formErrors.date}</p>}
            </div>

            {/* ── From Time ── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From Time</Label>
              <Input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
              {formErrors.fromTime && <p className="text-xs text-destructive">{formErrors.fromTime}</p>}
            </div>

            {/* ── To Time ── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To Time</Label>
              <Input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
              {formErrors.toTime && <p className="text-xs text-destructive">{formErrors.toTime}</p>}
            </div>

            {/* ── Team Lead (auto-assigned from student's club) ── */}
            {isStudent && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Lead</Label>
                {matchedTeamLead ? (
                  <div className="flex items-center gap-2 h-10 px-3 border bg-muted text-sm">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {matchedTeamLead.name}
                      {matchedTeamLead.clubName ? ` (${matchedTeamLead.clubName})` : ""}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 h-10 px-3 border border-dashed text-sm text-muted-foreground">
                    <span>No team lead found for your club</span>
                  </div>
                )}
                {formErrors.teamLeadId && <p className="text-xs text-destructive">{formErrors.teamLeadId}</p>}
              </div>
            )}

            {/* ── Staff Advisor (manual selection) ── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Staff Advisor</Label>
              <Select onValueChange={(v) => { setStaffId(v); setFormErrors((prev) => { const n = { ...prev }; delete n.staffId; return n }) }}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.department ? `(${s.department})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.staffId && <p className="text-xs text-destructive">{formErrors.staffId}</p>}
            </div>

            {/* ── Hostel Warden (auto-locked for students, dropdown for team leads) ── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hostel Warden</Label>
              {isStudent ? (
                matchedWarden ? (
                  <div className="flex items-center gap-2 h-10 px-3 border bg-muted text-sm">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {matchedWarden.name}
                      {matchedWarden.hostelName ? ` (${matchedWarden.hostelName})` : ""}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 h-10 px-3 border border-dashed text-sm text-muted-foreground">
                    <span>
                      {profile.hostelName
                        ? `No warden found for your hostel (${profile.hostelName})`
                        : "Hostel not set in your profile"}
                    </span>
                  </div>
                )
              ) : (
                /* Team leads — auto-match warden from their hostel */
                matchedWarden ? (
                  <div className="flex items-center gap-2 h-10 px-3 border bg-muted text-sm">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {matchedWarden.name}
                      {matchedWarden.hostelName ? ` (${matchedWarden.hostelName})` : ""}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 h-10 px-3 border border-dashed text-sm text-muted-foreground">
                    <span>
                      {profile.hostelName
                        ? `No warden found for your hostel (${profile.hostelName})`
                        : "Hostel not set in your profile"}
                    </span>
                  </div>
                )
              )}
              {formErrors.hostelId && <p className="text-xs text-destructive">{formErrors.hostelId}</p>}
            </div>
          </div>

          {/* ── Remarks ── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remarks / Reason</Label>
            <Textarea
              placeholder="Explain the purpose of your stayback request (min 10 characters)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
            {formErrors.remarks && <p className="text-xs text-destructive">{formErrors.remarks}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Submit Request
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
