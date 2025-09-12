// components/auth/login-form.tsx

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
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-6">
            <span className="text-white font-bold text-xl">HM</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your hostel management account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-xl rounded-xl p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Select Your Role
              </label>
              <select
                {...register("role")}
                onChange={(e) => handleRoleChange(e.target.value as Role)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
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
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    {...register("email")}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <svg 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email.message}
                  </p>
                )}
              </div>
            )}

            {/* UID Field */}
            {showUID && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {isUIDRequired ? "UID (Required)" : "UID"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isUIDRequired ? "Enter your staff UID" : "Enter your UID"}
                    {...register("uid")}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <svg 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                {errors.uid && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.uid.message}
                  </p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <svg 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
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

        {/* Demo Credentials (Remove in production) */}
        {/* <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Demo Credentials:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div>Student: student@example.com</div>
            <div>Admin: admin@example.com</div>
            <div>Staff: staff_uid</div>
            <div>Password: demo123</div>
          </div>
        </div> */}
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