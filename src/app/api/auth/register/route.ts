// app/api/register/route.ts

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { studentRegisterSchema } from "@/lib/validations/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Registration request body:", body)
    
    // Validate input
    const validatedData = studentRegisterSchema.parse(body)
    console.log("Validated data:", validatedData)
    
    // Check if user already exists (email OR uid)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { uid: validatedData.uid } // FIXED: Check actual UID, not email
        ]
      }
    })
    
    if (existingUser) {
      console.log("User already exists:", existingUser.email || existingUser.uid)
      return NextResponse.json(
        { error: "User with this email or UID already exists", success: false },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    console.log("Password hashed successfully")
    
    // Create user and student profile
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        uid: validatedData.uid, // FIXED: Use actual UID from form
        password: hashedPassword,
        role: "STUDENT",
        student: {
          create: {
            name: validatedData.name,
            clubName: validatedData.clubName,
            hostelName: validatedData.hostelName,
            roomNo: validatedData.roomNo,
            phoneNumber: validatedData.phoneNumber,
            isTeamLead: false
          },
        },
      },
      include: {
        student: true,
      },
    })
    
    console.log("User created successfully:", user.id, user.email, user.uid)
    
    return NextResponse.json(
      { 
        message: "Registration successful! You can now login with your credentials.",
        success: true,
        userId: user.id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === "ZodError") {
      console.log("Validation errors:", (error as any).errors)
      return NextResponse.json(
        { 
          error: "Invalid input data", 
          details: (error as any).errors,
          success: false 
        },
        { status: 400 }
      )
    }
    
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
      console.log("Prisma unique constraint error")
      return NextResponse.json(
        { 
          error: "User with this email or UID already exists",
          success: false 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Registration failed. Please try again.",
        success: false 
      },
      { status: 500 }
    )
  }
}