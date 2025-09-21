"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Role } from "@prisma/client"
import { loginSchema } from "@/lib/validations/auth"
import Link from "next/link"

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "STUDENT",
    },
  })
  
  const watchRole = watch("role")
  
  // Determine which credential fields to show
  const showEmail = watchRole === "ADMIN" || watchRole === "STUDENT" || watchRole === "STAFF" || watchRole === "HOSTEL" || watchRole === "TEAM_LEAD"
  const showUID = watchRole === "STAFF" || watchRole === "HOSTEL" || watchRole === "TEAM_LEAD" || watchRole === "STUDENT"
  const isUIDRequired = watchRole === "STAFF" || watchRole === "HOSTEL" || watchRole === "TEAM_LEAD"
  const isEmailRequired = watchRole === "ADMIN" || watchRole === "STUDENT"

  const handleRoleChange = (role: Role) => {
    setValue("role", role)
    // Clear previous credential values when role changes
    setValue("email", "")
    setValue("uid", "")
    setError(null)
  }
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signIn("credentials", {
        email: data.email || "",
        uid: data.uid || "",
        password: data.password,
        role: data.role,
        redirect: false,
      })
      
      if (result?.error) {
        setError("Invalid credentials. Please check your email/UID and password.")
      } else {
        // Successful login - redirect to appropriate dashboard
        router.push(getDashboardUrl(data.role))
        router.refresh()
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role: Role) => {
    const colors = {
      STUDENT: "bg-indigo-100 text-indigo-800",
      STAFF: "bg-green-100 text-green-800", 
      ADMIN: "bg-purple-100 text-purple-800",
      HOSTEL: "bg-blue-100 text-blue-800",
      TEAM_LEAD: "bg-orange-100 text-orange-800"
    }
    return colors[role]
  }

  const getRoleDescription = (role: Role) => {
    const descriptions = {
      STUDENT: "Access your stayback requests and club activities",
      STAFF: "Manage approvals and team lead operations", 
      ADMIN: "Full system administration access",
      HOSTEL: "Manage hostel-specific approvals",
      TEAM_LEAD: "Approve requests for your club members"
    }
    return descriptions[role]
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow mb-6">
            <span className="text-white font-bold text-xl">HM</span>
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your hostel management account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow rounded-xl p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Your Role
              </label>
              <select
                {...register("role")}
                onChange={(e) => handleRoleChange(e.target.value as Role)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all bg-white text-gray-900"
              >
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
                <option value="HOSTEL">Hostel Admin</option>
                <option value="TEAM_LEAD">Team Lead</option>
              </select>
              
              {/* Role Badge and Description */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(watchRole)} w-fit`}>
                  {watchRole.replace("_", " ")}
                </span>
                <p className="text-xs text-gray-500 sm:text-right">
                  {getRoleDescription(watchRole)}
                </p>
              </div>
            </div>

            {/* Email Field */}
            {showEmail && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  {...register("email")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>
            )}

            {/* UID Field */}
            {showUID && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {isUIDRequired ? "UID (Required)" : "UID"}
                </label>
                <input
                  type="text"
                  placeholder={isUIDRequired ? "Enter your staff UID" : "Enter your UID"}
                  {...register("uid")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                />
                {errors.uid && (
                  <p className="text-red-600 text-sm">
                    {errors.uid.message}
                  </p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Hide" : "View"}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <span className="mr-2">Signing in...</span>
              ) : (
                <span className="mr-2">Sign In</span>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="space-y-4 pt-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Link 
                href="/register" 
                className="text-center sm:text-left text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                New student? Create account →
              </Link>
              <Link 
                href="/forgot-password" 
                className="text-center sm:text-right text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            
            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact your hostel administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getDashboardUrl(role: Role): string {
  const dashboards: Record<Role, string> = {
    ADMIN: "/admin",
    STAFF: "/staff",
    STUDENT: "/student",
    TEAM_LEAD: "/team-lead",
    HOSTEL: "/hostel",
  }
  return dashboards[role] || "/"
}