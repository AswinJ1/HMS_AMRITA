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
            staff: {
              include: {
                user: {
                  select: {
                    email: true,
                    uid: true,
                  }
                }
              }
            },
            hostel: {
              include: {
                user: {
                  select: {
                    email: true,
                    uid: true,
                  }
                }
              }
            },
            teamLead: {
              include: {
                user: {
                  select: {
                    email: true,
                    uid: true,
                  }
                }
              }
            },
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
        status: "PENDING", // Set initial status as PENDING
      },
    })
    
    console.log(`✅ Created stayback request: ${staybackRequest.id}`)
    
    // Now we need to determine who should approve this request
    // Find ALL staff members (or you can implement logic to find specific staff)
    const staffMembers = await prisma.staff.findMany({
      take: 1, // For now, just get the first staff member
    })
    
    // Find the hostel for this student
    const hostel = await prisma.hostel.findFirst({
      where: { 
        hostelName: student.hostelName 
      },
    })
    
    // Find the team lead for this club
    const teamLead = await prisma.teamLead.findFirst({
      where: { 
        clubName: validatedData.clubName 
      },
    })
    
    console.log(`📋 Found approvers - Staff: ${staffMembers.length}, Hostel: ${hostel?.id}, TeamLead: ${teamLead?.id}`)
    
    const approvalPromises = []
    
    // Create approval record for staff (if exists)
    if (staffMembers.length > 0) {
      approvalPromises.push(
        prisma.staybackApproval.create({
          data: {
            requestId: staybackRequest.id,
            staffId: staffMembers[0].id,
            status: "PENDING",
          },
        })
      )
      console.log(`👤 Creating staff approval for staff ID: ${staffMembers[0].id}`)
    }
    
    // Create approval record for hostel (if exists)
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
      console.log(`🏠 Creating hostel approval for hostel ID: ${hostel.id}`)
    }
    
    // Create approval record for team lead (if exists)
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
      console.log(`👥 Creating team lead approval for team lead ID: ${teamLead.id}`)
    }
    
    // If no approvers found, log a warning
    if (approvalPromises.length === 0) {
      console.warn(`⚠️ No approvers found for request ${staybackRequest.id}`)
      console.warn(`   - Student hostel: ${student.hostelName}`)
      console.warn(`   - Club name: ${validatedData.clubName}`)
    }
    
    // Create all approval records
    const approvals = await Promise.all(approvalPromises)
    console.log(`✅ Created ${approvals.length} approval records`)
    
    return NextResponse.json(
      { 
        message: "Stayback request created successfully", 
        id: staybackRequest.id,
        approvalsCreated: approvals.length 
      },
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