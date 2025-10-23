// app/api/stayback/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { staybackRequestSchema } from "@/lib/validations/stayback"
import { z } from "zod"

// Helper function to retry database queries
async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn()
    } catch (error: any) {
      if (error.code === 'P1001' && attempt < maxRetries) {
        console.log(`Database connection failed, retrying... (${attempt}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get student's stayback requests with retry
    const student = await retryQuery(() =>
      prisma.student.findUnique({
        where: { userId: session.user.id },
      })
    )
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    const requests = await retryQuery(() =>
      prisma.staybackRequest.findMany({
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
    )
    
    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching stayback requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch requests. Please try again." },
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
    
    // Get student profile with retry
    const student = await retryQuery(() =>
      prisma.student.findUnique({
        where: { userId: session.user.id },
      })
    )
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    // Verify approvers exist with retry and parallel execution
    const verificationResults = await Promise.allSettled([
      staffId ? retryQuery(() => prisma.staff.findUnique({ where: { id: staffId } })) : Promise.resolve(null),
      hostelId ? retryQuery(() => prisma.hostel.findUnique({ where: { id: hostelId } })) : Promise.resolve(null),
      teamLeadId ? retryQuery(() => prisma.teamLead.findUnique({ where: { id: teamLeadId } })) : Promise.resolve(null),
    ])
    
    // Check if any verification failed
    const failures = verificationResults.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      console.error('Verification failures:', failures)
      return NextResponse.json(
        { error: "Database connection error. Please try again." },
        { status: 500 }
      )
    }
    
    // Extract verified approvers
    const [staffResult, hostelResult, teamLeadResult] = verificationResults.map(r => 
      r.status === 'fulfilled' ? r.value : null
    )
    
    // Validate that provided IDs actually exist
    if (staffId && !staffResult) {
      return NextResponse.json({ error: "Selected staff not found" }, { status: 400 })
    }
    if (hostelId && !hostelResult) {
      return NextResponse.json({ error: "Selected hostel not found" }, { status: 400 })
    }
    if (teamLeadId && !teamLeadResult) {
      return NextResponse.json({ error: "Selected team lead not found" }, { status: 400 })
    }
    
    // If no team lead ID provided, try to find based on club name
    let finalTeamLeadId = teamLeadId
    if (!teamLeadId && validatedData.clubName) {
      const teamLead = await retryQuery(() =>
        prisma.teamLead.findFirst({
          where: { 
            clubName: {
              equals: validatedData.clubName,
              mode: 'insensitive'
            }
          },
        })
      )
      if (teamLead) {
        finalTeamLeadId = teamLead.id
      }
    }
    
    // Ensure at least one approver is selected
    if (!staffId && !hostelId && !finalTeamLeadId) {
      return NextResponse.json(
        { error: "Please select at least one approver" },
        { status: 400 }
      )
    }
    
    // Create stayback request with retry
    const staybackRequest = await retryQuery(() =>
      prisma.staybackRequest.create({
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
    )

    console.log(`✅ Created stayback request: ${staybackRequest.id}`)
    console.log(`📋 Creating approvals for - Staff: ${staffId}, Hostel: ${hostelId}, TeamLead: ${finalTeamLeadId}`)
    
    // Create approval records with retry
    const approvalPromises = []
    
    if (staffId) {
      approvalPromises.push(
        retryQuery(() =>
          prisma.staybackApproval.create({
            data: {
              requestId: staybackRequest.id,
              staffId: staffId,
              status: "PENDING",
            },
          })
        ).then(approval => {
          console.log(`👤 Created staff approval`)
          return approval
        })
      )
    }
    
    if (hostelId) {
      approvalPromises.push(
        retryQuery(() =>
          prisma.staybackApproval.create({
            data: {
              requestId: staybackRequest.id,
              hostelId: hostelId,
              status: "PENDING",
            },
          })
        ).then(approval => {
          console.log(`🏠 Created hostel approval`)
          return approval
        })
      )
    }
    
    if (finalTeamLeadId) {
      approvalPromises.push(
        retryQuery(() =>
          prisma.staybackApproval.create({
            data: {
              requestId: staybackRequest.id,
              teamLeadId: finalTeamLeadId,
              status: "PENDING",
            },
          })
        ).then(approval => {
          console.log(`👥 Created team lead approval`)
          return approval
        })
      )
    }
    
    // Create all approval records
    const approvalResults = await Promise.allSettled(approvalPromises)
    
    // Check if any approval creation failed
    const approvalFailures = approvalResults.filter(r => r.status === 'rejected')
    if (approvalFailures.length > 0) {
      console.error('Approval creation failures:', approvalFailures)
      
      // Cleanup: delete the request if approvals failed
      await retryQuery(() =>
        prisma.staybackRequest.delete({ where: { id: staybackRequest.id } })
      ).catch(err => console.error('Failed to cleanup request:', err))
      
      return NextResponse.json(
        { error: "Failed to create approvals. Please try again." },
        { status: 500 }
      )
    }
    
    const approvals = approvalResults
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value)
    
    console.log(`✅ Created ${approvals.length} approval records`)
    
    return NextResponse.json(
      { 
        message: "Stayback request created successfully", 
        id: staybackRequest.id,
        approvalsCreated: approvals.length,
        approvers: {
          staff: !!staffId,
          hostel: !!hostelId,
          teamLead: !!finalTeamLeadId,
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
      { error: "Failed to create request. Please try again." },
      { status: 500 }
    )
  }
}