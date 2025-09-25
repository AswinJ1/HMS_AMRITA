// app/api/stayback/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { staybackRequestSchema } from "@/lib/validations/stayback"
import { z } from "zod"

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
    
    // Add security tracking info to each request
    const requestsWithSecurity = await Promise.all(requests.map(async (request) => {
      // Find security tracking approval for this request
      const securityApproval = await prisma.staybackApproval.findFirst({
        where: {
          requestId: request.id,
          comments: {
            startsWith: "SECURITY_TRACKING:"
          }
        }
      })
      
      return {
        ...request,
        securityTracking: securityApproval ? {
          status: securityApproval.status,
          comments: securityApproval.comments,
          approvedAt: securityApproval.approvedAt
        } : null
      }
    }))
    
    return NextResponse.json(requestsWithSecurity)
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
    
    // Extract the specific approver IDs from the request
    const { staffId, hostelId, teamLeadId, ...requestData } = body
    
    // Validate the base request data
    const validatedData = staybackRequestSchema.parse({
      clubName: requestData.clubName,
      date: new Date(requestData.date),
      fromTime: requestData.fromTime,
      toTime: requestData.toTime,
      remarks: requestData.remarks,
    })
    
    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    // Verify that the specified approvers exist
    const verificationPromises = []
    
    if (staffId) {
      verificationPromises.push(
        prisma.staff.findUnique({ where: { id: staffId } })
          .then(staff => ({ type: 'staff', id: staffId, exists: !!staff }))
      )
    }
    
    if (hostelId) {
      verificationPromises.push(
        prisma.hostel.findUnique({ where: { id: hostelId } })
          .then(hostel => ({ type: 'hostel', id: hostelId, exists: !!hostel }))
      )
    }
    
    // If no team lead ID provided, try to find based on club name
    let finalTeamLeadId = teamLeadId
    if (!teamLeadId && validatedData.clubName) {
      const teamLead = await prisma.teamLead.findFirst({
        where: { 
          clubName: {
            equals: validatedData.clubName,
            mode: 'insensitive'
          }
        },
      })
      if (teamLead) {
        finalTeamLeadId = teamLead.id
      }
    } else if (teamLeadId) {
      verificationPromises.push(
        prisma.teamLead.findUnique({ where: { id: teamLeadId } })
          .then(teamLead => ({ type: 'teamLead', id: teamLeadId, exists: !!teamLead }))
      )
    }
    
    // Verify all approvers exist
    const verificationResults = await Promise.all(verificationPromises)
    const missingApprovers = verificationResults.filter(r => !r.exists)
    
    if (missingApprovers.length > 0) {
      return NextResponse.json(
        { 
          error: "Invalid approver selection", 
          details: missingApprovers.map(a => `${a.type} with ID ${a.id} not found`)
        },
        { status: 400 }
      )
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
        status: "PENDING",
      },
    })

    console.log(`✅ Created stayback request: ${staybackRequest.id}`)
    
    // Find a security user for tracking (automatically assign the first available security user)
    const securityUser = await prisma.security.findFirst({
      orderBy: { createdAt: 'asc' } // Get the first/primary security user
    })
    
    console.log(`📋 Creating approvals for - Staff: ${staffId}, Hostel: ${hostelId}, TeamLead: ${finalTeamLeadId}, Security: ${securityUser?.id || 'none'}`)
    
    // Create approval records for the specified approvers
    const approvalPromises = []
    
    // Create approval for specified staff
    if (staffId) {
      approvalPromises.push(
        prisma.staybackApproval.create({
          data: {
            requestId: staybackRequest.id,
            staffId: staffId,
            status: "PENDING",
          },
        }).then(approval => {
          console.log(`👤 Created staff approval for staff ID: ${staffId}`)
          return approval
        })
      )
    }
    
    // Create approval for specified hostel
    if (hostelId) {
      approvalPromises.push(
        prisma.staybackApproval.create({
          data: {
            requestId: staybackRequest.id,
            hostelId: hostelId,
            status: "PENDING",
          },
        }).then(approval => {
          console.log(`🏠 Created hostel approval for hostel ID: ${hostelId}`)
          return approval
        })
      )
    }
    
    // Create approval for team lead (either specified or auto-found)
    if (finalTeamLeadId) {
      approvalPromises.push(
        prisma.staybackApproval.create({
          data: {
            requestId: staybackRequest.id,
            teamLeadId: finalTeamLeadId,
            status: "PENDING",
          },
        }).then(approval => {
          console.log(`👥 Created team lead approval for team lead ID: ${finalTeamLeadId}`)
          return approval
        })
      )
    }
    
    // Create security tracking record - use a special approval entry with comments to identify as security
    if (securityUser) {
      // Since we can't add securityId to the approval table without migration,
      // we'll create a special staff approval with a security identifier in comments
      approvalPromises.push(
        prisma.staybackApproval.create({
          data: {
            requestId: staybackRequest.id,
            // We'll use the staffId field but mark it as a security tracking record
            staffId: null, // Keep this null to differentiate from regular staff approvals
            status: "PENDING",
            comments: `SECURITY_TRACKING:${securityUser.id}:${securityUser.name}` // Special format to identify security tracking
          },
        }).then(approval => {
          console.log(`🔒 Created security tracking for security ID: ${securityUser.id}`)
          return approval
        })
      )
    }
    
    // Ensure at least one approver is assigned
    if (approvalPromises.length === 0) {
      // Delete the request if no approvers could be assigned
      await prisma.staybackRequest.delete({ where: { id: staybackRequest.id } })
      
      return NextResponse.json(
        { 
          error: "No approvers selected. Please select at least one approver." 
        },
        { status: 400 }
      )
    }
    
    // Create all approval records
    const approvals = await Promise.all(approvalPromises)
    console.log(`✅ Created ${approvals.length} approval records`)
    
    // Optional: Send notifications to approvers (email/SMS)
    // await sendNotificationToApprovers(approvals)
    
    return NextResponse.json(
      { 
        message: "Stayback request created successfully", 
        id: staybackRequest.id,
        approvalsCreated: approvals.length,
        approvers: {
          staff: staffId ? true : false,
          hostel: hostelId ? true : false,
          teamLead: finalTeamLeadId ? true : false,
          security: securityUser ? true : false,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating stayback request:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    )
  }
}