// components/forms/stayback-form.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { staybackRequestSchema, StaybackRequestInput } from "@/lib/validations/stayback"
import { format } from "date-fns"

export function StaybackForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<StaybackRequestInput>({
    resolver: zodResolver(staybackRequestSchema),
  })
  
  const watchFromTime = watch("fromTime")
  
  const onSubmit = async (data: StaybackRequestInput) => {
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
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Submit Stayback Request</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Club Name</label>
          <input
            type="text"
            {...register("clubName")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter club name"
          />
          {errors.clubName && (
            <p className="text-red-500 text-sm mt-1">{errors.clubName.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
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
            <label className="block text-sm font-medium mb-2">From Time</label>
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
            <label className="block text-sm font-medium mb-2">To Time</label>
            <input
              type="time"
              {...register("toTime")}
              min={watchFromTime} // Prevent selecting time before fromTime
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
        
        <div>
          <label className="block text-sm font-medium mb-2">Reason (Remarks)</label>
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
          disabled={isLoading}
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