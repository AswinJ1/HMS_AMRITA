// lib/validations/auth.ts

import { z } from "zod"
import { Role } from "@prisma/client"

// Login schemas for different user types
export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const staffLoginSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const studentLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

// Generic login schema
export const loginSchema = z.object({
  email: z.string().email().optional(),
  uid: z.string().optional(),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["ADMIN", "STAFF", "HOSTEL", "TEAM_LEAD", "STUDENT"], {
    message: "Please select a valid role",
  }),
}).refine((data) => {
  // ADMIN: Requires email
  if (data.role === "ADMIN" && !data.email) {
    return false
  }
  // STUDENT: Requires email (but can also use UID)
  if (data.role === "STUDENT" && !data.email && !data.uid) {
    return false
  }
  // STAFF, HOSTEL, TEAM_LEAD: Requires UID (but should also have email)
  if ((data.role === "STAFF" || data.role === "HOSTEL" || data.role === "TEAM_LEAD") && !data.uid) {
    return false
  }
  return true
}, {
  message: "Please provide the required credentials for your role",
  path: ["email"],
})

// Student registration schema - FIXED TO INCLUDE UID
export const studentRegisterSchema = z.object({
  // Basic credentials
  email: z.string().email("Invalid email address"),
  uid: z.string()
    .min(8, "UID must be at least 8 characters")
    .max(15, "UID must not exceed 15 characters")
    .regex(/^[A-Z0-9]+$/, "UID must contain only uppercase letters and numbers"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  // Personal details
  name: z.string().min(2, "Name must be at least 2 characters"),
  clubName: z.string().min(1, "Club name is required"),
  hostelName: z.string().min(1, "Hostel name is required"),
  roomNo: z.string().min(1, "Room number is required"),
  phoneNumber: z.string()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Staff/Hostel user creation schema (by admin)
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  uid: z.string().min(1, "UID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["STAFF", "HOSTEL"]),
  department: z.string().optional(), // For staff
  hostelName: z.string().optional(), // For hostel
}).refine((data) => {
  if (data.role === "STAFF" && !data.department) {
    return false
  }
  if (data.role === "HOSTEL" && !data.hostelName) {
    return false
  }
  return true
}, {
  message: "Missing required fields for the selected role",
})