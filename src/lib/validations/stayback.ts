// lib/validations/stayback.ts

import { z } from "zod"

// Auth schemas (moved from auth.ts or defined here if missing)
export const studentRegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  uid: z.string().min(1, "UID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  clubName: z.string().min(1, "Club name is required"),
  hostelName: z.string().min(1, "Hostel name is required"),
  roomNo: z.string().min(1, "Room number is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
})

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  uid: z.string().min(1, "UID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["ADMIN", "STAFF", "HOSTEL", "TEAM_LEAD", "STUDENT"], {
    message: "Role is required",
  }),
  // Optional fields based on role
  clubName: z.string().optional(),
  hostelName: z.string().optional(),
  roomNo: z.string().optional(),
  phoneNumber: z.string().optional(),
  department: z.string().optional(),
})

// Stayback request schema
export const staybackRequestSchema = z.object({
  clubName: z.string().min(1, "Club name is required"),
  date: z.date({
    message: "Date is required",
  }),
  fromTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time in HH:MM format"),
  toTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time in HH:MM format"),
  remarks: z.string().min(10, "Remarks must be at least 10 characters long"),
}).refine((data) => {
  // Validate that fromTime is before toTime
  const fromMinutes = timeToMinutes(data.fromTime)
  const toMinutes = timeToMinutes(data.toTime)
  return fromMinutes < toMinutes
}, {
  message: "End time must be after start time",
  path: ["toTime"],
})

// Helper function to convert time string to minutes for comparison
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Alternative stayback request schema with proper date object
export const staybackRequestFormSchema = z.object({
  clubName: z.string().min(1, "Club name is required"),
  date: z.date({
    message: "Date is required",
  }).refine((date) => date > new Date(), "Date must be in the future"),
  time: z.string().min(1, "Time is required"),
  remarks: z.string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters"),
})

// Stayback approval schema
export const staybackApprovalSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  status: z.enum(["APPROVED", "REJECTED"], {
    message: "Status must be either APPROVED or REJECTED"
  }),
  comments: z.string().optional(),
})

// Promote to team lead schema
export const promoteToTeamLeadSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  clubName: z.string().min(1, "Club name is required"),
  department: z.string().optional(),
})

// Filter schema for admin logs
export const staybackFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  studentId: z.string().optional(),
  clubName: z.string().optional(),
  hostelName: z.string().optional(),
})

// Create staff user schema
export const createStaffUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  uid: z.string().min(1, "UID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["STAFF", "HOSTEL"], {
    message: "Role is required",
  }),
  department: z.string().optional(),
  hostelName: z.string().optional(),
})

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

// Type exports
export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>
export type StaybackRequestInput = z.infer<typeof staybackRequestSchema>
export type StaybackRequestFormInput = z.infer<typeof staybackRequestFormSchema>
export type StaybackApprovalInput = z.infer<typeof staybackApprovalSchema>
export type PromoteToTeamLeadInput = z.infer<typeof promoteToTeamLeadSchema>
export type StaybackFilterInput = z.infer<typeof staybackFilterSchema>
export type LoginInput = z.infer<typeof loginSchema>

// Legacy export for backwards compatibility
export const CreateUserData = createStaffUserSchema