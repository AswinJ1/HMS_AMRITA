import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET current user's profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        staff: true,
        hostel: true,
        teamLead: true,
        admin: true,
        security: true,
      },
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PATCH/PUT update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, department, hostelName, phoneNumber, roomNo, currentPassword, newPassword } = body
    
    // Get current user with all relations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        staff: true,
        hostel: true,
        security: true,
        teamLead: true,
        admin: true,
        student: true,
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const userUpdates: any = {}
    
    // Handle password change with validation
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        )
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        )
      }
      
      // Validate new password
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        )
      }
      
      userUpdates.password = await bcrypt.hash(newPassword, 10)
    }
    
    // Update based on user role
    let updatedUser
    
    switch (user.role) {
      case "SECURITY":
        if (!user.security) {
          return NextResponse.json({ error: "Security profile not found" }, { status: 404 })
        }
        updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            ...userUpdates,
            security: {
              update: {
                name: name || user.security.name,
                department: department || user.security.department,
              }
            }
          },
          include: { 
            security: true 
          }
        })
        break
        
      case "STAFF":
        if (!user.staff) {
          return NextResponse.json({ error: "Staff profile not found" }, { status: 404 })
        }
        updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            ...userUpdates,
            staff: {
              update: {
                name: name || user.staff.name,
                department: department || user.staff.department,
              }
            }
          },
          include: { 
            staff: true 
          }
        })
        break
        
      case "HOSTEL":
        if (!user.hostel) {
          return NextResponse.json({ error: "Hostel profile not found" }, { status: 404 })
        }
        updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            ...userUpdates,
            hostel: {
              update: {
                name: name || user.hostel.name,
                hostelName: hostelName || user.hostel.hostelName,
              }
            }
          },
          include: { 
            hostel: true 
          }
        })
        break
        
      case "TEAM_LEAD":
        if (!user.teamLead) {
          return NextResponse.json({ error: "Team Lead profile not found" }, { status: 404 })
        }
        updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            ...userUpdates,
            teamLead: {
              update: {
                name: name || user.teamLead.name,
              }
            }
          },
          include: { 
            teamLead: true 
          }
        })
        break
        
      case "ADMIN":
        if (!user.admin) {
          return NextResponse.json({ error: "Admin profile not found" }, { status: 404 })
        }
        updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            ...userUpdates,
            admin: {
              update: {
                name: name || user.admin.name,
              }
            }
          },
          include: { 
            admin: true 
          }
        })
        break
        
      case "STUDENT":
        if (!user.student) {
          return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
        }
        updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            ...userUpdates,
            student: {
              update: {
                name: name || user.student.name,
                phoneNumber: phoneNumber || user.student.phoneNumber,
                roomNo: roomNo || user.student.roomNo,
              }
            }
          },
          include: { 
            student: true 
          }
        })
        break
        
      default:
        return NextResponse.json(
          { error: "Invalid user role" },
          { status: 400 }
        )
    }
    
    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

// PUT is alias for PATCH (same functionality)
export async function PUT(request: NextRequest) {
  return PATCH(request)
}