// app/api/users/route.ts

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUserSchema } from "@/lib/validations/auth"

// GET all users (Admin and Staff)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    // Allow both ADMIN and STAFF to access user data
    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    let users
    
    if (session.user.role === "ADMIN") {
      // Admin can see all users
      users = await prisma.user.findMany({
        include: {
          student: true,
          staff: true,
          hostel: true,  // Make sure this matches your schema
          teamLead: true,
          admin: true,
        },
        orderBy: { createdAt: "desc" },
      })
    } else if (session.user.role === "STAFF") {
      // Staff can only see students and team leads
      users = await prisma.user.findMany({
        where: {
          role: {
            in: ["STUDENT", "TEAM_LEAD"]
          }
        },
        include: {
          student: true,
          teamLead: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }
    
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// POST create new user (Admin only - for Staff and Hostel users)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { uid: validatedData.uid },
        ],
      },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or UID already exists" },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)
    
    // Create user based on role
    let user
    
    if (validatedData.role === "STAFF") {
      user = await prisma.user.create({
        data: {
          email: validatedData.email,
          uid: validatedData.uid,
          password: hashedPassword,
          role: "STAFF",
          staff: {
            create: {
              name: validatedData.name,
              department: validatedData.department,
            },
          },
        },
        include: {
          staff: true,
        },
      })
    } else if (validatedData.role === "HOSTEL") {
      user = await prisma.user.create({
        data: {
          email: validatedData.email,
          uid: validatedData.uid,
          password: hashedPassword,
          role: "HOSTEL",
          hostel: {
            create: {
              name: validatedData.name,
              hostelName: validatedData.hostelName!,
            },
          },
        },
        include: {
          hostel: true,
        },
      })
    } else {
      return NextResponse.json(
        { error: "Invalid role for user creation" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}

// DELETE user (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }
    
    // Don't allow deleting the admin user
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    })
    
    if (userToDelete?.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      )
    }
    
    await prisma.user.delete({
      where: { id: userId },
    })
    
    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
