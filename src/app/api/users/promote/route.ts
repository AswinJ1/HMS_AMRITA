// app/api/users/promote/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { promoteToTeamLeadSchema } from "@/lib/validations/stayback"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = promoteToTeamLeadSchema.parse(body)
    
    // Find the student
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: { user: true },
    })
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    // Check if already a team lead
    const existingTeamLead = await prisma.teamLead.findUnique({
      where: { userId: student.userId },
    })
    
    if (existingTeamLead) {
      return NextResponse.json(
        { error: "Student is already a team lead" },
        { status: 400 }
      )
    }
    
    // Create team lead profile and update user role
    await prisma.$transaction([
      prisma.teamLead.create({
        data: {
          userId: student.userId,
          name: student.name,
          clubName: validatedData.clubName,
          department: validatedData.department,
        },
      }),
      prisma.user.update({
        where: { id: student.userId },
        data: { role: "TEAM_LEAD" },
      }),
      prisma.student.update({
        where: { id: student.id },
        data: { isTeamLead: true },
      }),
    ])
    
    return NextResponse.json(
      { message: "Student promoted to team lead successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error promoting to team lead:", error)
    return NextResponse.json(
      { error: "Failed to promote to team lead" },
      { status: 500 }
    )
  }
}
