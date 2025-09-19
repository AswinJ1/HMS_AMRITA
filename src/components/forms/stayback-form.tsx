// components/forms/stayback-form.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { staybackRequestSchema, StaybackRequestInput } from "@/lib/validations/stayback"
import { format } from "date-fns"

interface StaffOption {
  id: string
  name: string
  department: string | null
  email: string
}

interface HostelOption {
  id: string
  name: string
  hostelName: string
  email: string
}

interface TeamLeadOption {
  id: string
  name: string
  clubName: string
  email: string
}

interface ExtendedStaybackInput extends StaybackRequestInput {
  staffId: string
  hostelId: string
  teamLeadId: string
}

// Predefined club options
const CLUB_OPTIONS = [
  "bi0s",
  "amFOSS",
  "ICPC_Amrita",

]

export function StaybackForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // State for dropdown options
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [hostelOptions, setHostelOptions] = useState<HostelOption[]>([])
  const [teamLeadOptions, setTeamLeadOptions] = useState<TeamLeadOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ExtendedStaybackInput>({
    resolver: zodResolver(z.object({
      ...staybackRequestSchema.shape,
      staffId: z.string().min(1, "Please select a staff member"),
      hostelId: z.string().min(1, "Please select a hostel warden"),
      teamLeadId: z.string().min(1, "Please select a team lead"),
    })),
  })
  
  const watchFromTime = watch("fromTime")
  const watchClubName = watch("clubName")
  const watchTeamLeadId = watch("teamLeadId")
  
  // Fetch available staff, hostel wardens, and team leads
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true)
      try {
        // Fetch staff members
        const staffResponse = await fetch("/api/staff/list")
        if (staffResponse.ok) {
          const staffData = await staffResponse.json()
          setStaffOptions(staffData)
        }
        
        // Fetch hostel wardens
        const hostelResponse = await fetch("/api/hostel/list")
        if (hostelResponse.ok) {
          const hostelData = await hostelResponse.json()
          setHostelOptions(hostelData)
        }
        
        // Fetch team leads
        const teamLeadResponse = await fetch("/api/teamlead/list")
        if (teamLeadResponse.ok) {
          const teamLeadData = await teamLeadResponse.json()
          setTeamLeadOptions(teamLeadData)
        }
      } catch (error) {
        console.error("Error fetching options:", error)
        setError("Failed to load approval options")
      } finally {
        setIsLoadingOptions(false)
      }
    }
    
    fetchOptions()
  }, [])
  
  // Auto-suggest team lead when club name changes
  useEffect(() => {
    if (watchClubName && teamLeadOptions.length > 0) {
      const matchingTeamLead = teamLeadOptions.find(
        tl => tl.clubName.toLowerCase() === watchClubName.toLowerCase()
      )
      if (matchingTeamLead) {
        // Auto-select the matching team lead
        setValue("teamLeadId", matchingTeamLead.id)
      } else {
        // Clear team lead selection if no match found
        setValue("teamLeadId", "")
      }
    }
  }, [watchClubName, teamLeadOptions, setValue])
  
  const onSubmit = async (data: ExtendedStaybackInput) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const response = await fetch("/api/stayback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clubName: data.clubName,
          date: data.date.toISOString(),
          fromTime: data.fromTime,
          toTime: data.toTime,
          remarks: data.remarks,
          staffId: data.staffId,
          hostelId: data.hostelId,
          teamLeadId: data.teamLeadId,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setError(result.error || "Failed to submit request")
      } else {
        setSuccess(true)
        reset()
        setTimeout(() => {
          router.push("/student/requests")
        }, 2000)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Filter team leads based on selected club
  const availableTeamLeads = watchClubName 
    ? teamLeadOptions.filter(tl => 
        tl.clubName.toLowerCase() === watchClubName.toLowerCase()
      )
    : teamLeadOptions
  
  if (isLoadingOptions) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Submit Stayback Request</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Club Name Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Club Name <span className="text-red-500">*</span>
          </label>
          <select
            {...register("clubName")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Club --</option>
            {CLUB_OPTIONS.map(club => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
          {errors.clubName && (
            <p className="text-red-500 text-sm mt-1">{errors.clubName.message}</p>
          )}
        </div>
        
        {/* Team Lead Selection Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Team Lead for Approval <span className="text-red-500">*</span>
          </label>
          <select
            {...register("teamLeadId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!watchClubName}
          >
            <option value="">
              {!watchClubName ? "-- Select Club First --" : "-- Select Team Lead --"}
            </option>
            {availableTeamLeads.map(teamLead => (
              <option key={teamLead.id} value={teamLead.id}>
                {teamLead.name} ({teamLead.clubName}) - {teamLead.email}
              </option>
            ))}
          </select>
          {errors.teamLeadId && (
            <p className="text-red-500 text-sm mt-1">{errors.teamLeadId.message}</p>
          )}
          {watchClubName && availableTeamLeads.length === 0 && (
            <p className="text-orange-500 text-sm mt-1">
              ⚠️ No team lead found for "{watchClubName}". Please contact admin to add a team lead for this club.
            </p>
          )}
          {watchClubName && watchTeamLeadId && teamLeadOptions.find(tl => tl.id === watchTeamLeadId) && (
            <p className="text-green-600 text-sm mt-1">
              ✓ {teamLeadOptions.find(tl => tl.id === watchTeamLeadId)?.name} selected for {teamLeadOptions.find(tl => tl.id === watchTeamLeadId)?.clubName}
            </p>
          )}
        </div>
        
        {/* Staff Selection Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Staff for Approval <span className="text-red-500">*</span>
          </label>
          <select
            {...register("staffId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Staff Member --</option>
            {staffOptions.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.name} {staff.department ? `(${staff.department})` : ''} - {staff.email}
              </option>
            ))}
          </select>
          {errors.staffId && (
            <p className="text-red-500 text-sm mt-1">{errors.staffId.message}</p>
          )}
        </div>
        
        {/* Hostel Warden Selection Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Hostel Warden for Approval <span className="text-red-500">*</span>
          </label>
          <select
            {...register("hostelId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Hostel Warden --</option>
            {hostelOptions.map(hostel => (
              <option key={hostel.id} value={hostel.id}>
                {hostel.name} ({hostel.hostelName}) - {hostel.email}
              </option>
            ))}
          </select>
          {errors.hostelId && (
            <p className="text-red-500 text-sm mt-1">{errors.hostelId.message}</p>
          )}
        </div>
        
        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register("date", { 
              valueAsDate: true,
              setValueAs: (value) => value ? new Date(value) : undefined
            })}
            min={format(new Date(), "yyyy-MM-dd")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
          )}
        </div>
        
        {/* Time Range Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              From Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              {...register("fromTime")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.fromTime && (
              <p className="text-red-500 text-sm mt-1">{errors.fromTime.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              To Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              {...register("toTime")}
              min={watchFromTime}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.toTime && (
              <p className="text-red-500 text-sm mt-1">{errors.toTime.message}</p>
            )}
          </div>
        </div>
        
        {/* Duration Display */}
        {watchFromTime && watch("toTime") && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Duration:</strong> {watchFromTime} - {watch("toTime")} 
              {(() => {
                const fromMinutes = timeToMinutes(watchFromTime)
                const toMinutes = timeToMinutes(watch("toTime") || "00:00")
                const duration = toMinutes - fromMinutes
                if (duration > 0) {
                  const hours = Math.floor(duration / 60)
                  const minutes = duration % 60
                  return ` (${hours}h ${minutes}m)`
                }
                return ""
              })()}
            </p>
          </div>
        )}
        
        {/* Remarks Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Reason (Remarks) <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register("remarks")}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Explain the reason for your stayback request..."
          />
          {errors.remarks && (
            <p className="text-red-500 text-sm mt-1">{errors.remarks.message}</p>
          )}
        </div>
        
        {/* Approval Summary */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-sm mb-2">Request will be sent to:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {watchClubName && (
              <li>• <strong>Club:</strong> {watchClubName}</li>
            )}
            {watch("teamLeadId") && teamLeadOptions.find(tl => tl.id === watch("teamLeadId")) && (
              <li>• <strong>Team Lead:</strong> {teamLeadOptions.find(tl => tl.id === watch("teamLeadId"))?.name}</li>
            )}
            {watch("staffId") && staffOptions.find(s => s.id === watch("staffId")) && (
              <li>• <strong>Staff:</strong> {staffOptions.find(s => s.id === watch("staffId"))?.name}</li>
            )}
            {watch("hostelId") && hostelOptions.find(h => h.id === watch("hostelId")) && (
              <li>• <strong>Hostel:</strong> {hostelOptions.find(h => h.id === watch("hostelId"))?.name}</li>
            )}
          </ul>
          {(!watchClubName || !watch("staffId") || !watch("hostelId") || !watch("teamLeadId")) && (
            <p className="text-orange-600 text-xs mt-2">
              Please select club and all three approvers to submit your request.
            </p>
          )}
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Request submitted successfully! Redirecting...
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || !watchClubName || !watch("staffId") || !watch("hostelId") || !watch("teamLeadId")}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  )
}

// Helper function for duration calculation
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}