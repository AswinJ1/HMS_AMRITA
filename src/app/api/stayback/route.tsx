// app/api/stayback/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { staybackRequestSchema } from "@/lib/validations/stayback"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get student's stayback requests
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    const requests = await prisma.staybackRequest.findMany({
      where: { studentId: student.id },
      include: {
        approvals: {
          include: {
            staff: true,
            hostel: true,
            teamLead: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    
    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching stayback requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = staybackRequestSchema.parse({
      clubName: body.clubName,
      date: new Date(body.date),
      fromTime: body.fromTime,
      toTime: body.toTime,
      remarks: body.remarks,
    })
    
    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    // Create stayback request
    const staybackRequest = await prisma.staybackRequest.create({
      data: {
        studentId: student.id,
        clubName: validatedData.clubName,
        date: validatedData.date,
        fromTime: validatedData.fromTime,
        toTime: validatedData.toTime,
        remarks: validatedData.remarks,
      },
    })
    
    // Create approval records for staff, hostel, and team lead
    // Find relevant approvers
    const [staff, hostel, teamLead] = await Promise.all([
      prisma.staff.findFirst(), // You might want to add logic to find specific staff
      prisma.hostel.findFirst({
        where: { hostelName: student.hostelName },
      }),
      prisma.teamLead.findFirst({
        where: { clubName: validatedData.clubName },
      }),
    ])
    
    const approvalPromises = []
    
    if (staff) {
      approvalPromises.push(
        prisma.staybackApproval.create({
          data: {
            requestId: staybackRequest.id,
            staffId: staff.id,
            status: "PENDING",
          },
        })
      )
    }
    
    if (hostel) {
      approvalPromises.push(
        prisma.staybackApproval.create({
          data: {
            requestId: staybackRequest.id,
            hostelId: hostel.id,
            status: "PENDING",
          },
        })
      )
    }
    
    if (teamLead) {
      approvalPromises.push(
        prisma.staybackApproval.create({
          data: {
            requestId: staybackRequest.id,
            teamLeadId: teamLead.id,
            status: "PENDING",
          },
        })
      )
    }
    
    await Promise.all(approvalPromises)
    
    return NextResponse.json(
      { message: "Stayback request created successfully", id: staybackRequest.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating stayback request:", error)
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    )
  }
}