// app/api/security/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET security dashboard data - only show fully approved stayback requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "SECURITY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get security user profile
    const security = await prisma.security.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!security) {
      return NextResponse.json({ error: "Security user not found" }, { status: 404 })
    }
    
    // Get ALL stayback requests with their approvals
    const allRequests = await prisma.staybackRequest.findMany({
      include: {
        student: {
          include: {
            user: {
              select: {
                email: true,
                uid: true,
              }
            }
          }
        },
        approvals: {
          include: {
            staff: {
              include: {
                user: {
                  select: {
                    email: true,
                    uid: true,
                    role: true
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
                    role: true
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
                    role: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    // Filter requests to only show those where all 3 main approvals are APPROVED
    const fullyApprovedRequests = allRequests.filter(request => {
      // Get only valid approvals
      const validApprovals = request.approvals.filter(
        approval => approval.staff || approval.hostel || approval.teamLead
      )
      
      // Must have exactly 3 approvals
      if (validApprovals.length !== 3) {
        return false
      }
      
      // All 3 must be APPROVED
      const allApproved = validApprovals.every(approval => approval.status === "APPROVED")
      
      return allApproved
    })
    
    // Transform the data for frontend
    const requests = fullyApprovedRequests.map(request => {
      // Get the valid approvals
      const validApprovals = request.approvals.filter(
        approval => approval.staff || approval.hostel || approval.teamLead
      )
      
      // ✅ Check security tracking from the dedicated fields (not comments)
      // Get the first approval that has security tracking info
      const trackedApproval = validApprovals.find(
        approval => approval.securityStatus
      )
      
      let securityStatus = "PENDING"
      let securityCheckedBy = null
      let securityCheckedAt = null
      
      if (trackedApproval) {
        securityStatus = trackedApproval.securityStatus || "PENDING"
        securityCheckedBy = trackedApproval.securityCheckedBy
        securityCheckedAt = trackedApproval.securityCheckedAt
      }
      
      return {
        id: request.id,
        student: request.student,
        clubName: request.clubName,
        date: request.date,
        fromTime: request.fromTime,
        toTime: request.toTime,
        remarks: request.remarks,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        securityStatus: securityStatus,
        securityCheckedBy: securityCheckedBy,
        securityCheckedAt: securityCheckedAt,
        approvals: validApprovals.map(approval => ({
          ...approval,
          // Remove security tracking info from approvals display
          securityStatus: undefined,
          securityCheckedBy: undefined,
          securityCheckedAt: undefined,
        })),
      }
    })
    
    return NextResponse.json({
      requests,
      securityUser: {
        id: security.id,
        name: security.name,
        department: security.department
      },
      totalApprovedRequests: requests.length
    })
  } catch (error) {
    console.error("Error fetching security data:", error)
    return NextResponse.json(
      { error: "Failed to fetch security data" },
      { status: 500 }
    )
  }
}

// POST - Mark student as IN or OUT
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "SECURITY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { requestId, status } = body
    
    // Validate status - only IN or OUT allowed
    if (!requestId || !status || !["IN", "OUT"].includes(status)) {
      return NextResponse.json(
        { error: "Request ID and valid status (IN or OUT) are required" },
        { status: 400 }
      )
    }
    
    const security = await prisma.security.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!security) {
      return NextResponse.json({ error: "Security user not found" }, { status: 404 })
    }
    
    // Verify the request exists and is fully approved
    const staybackRequest = await prisma.staybackRequest.findUnique({
      where: { id: requestId },
      include: {
        approvals: {
          include: {
            staff: true,
            hostel: true,
            teamLead: true
          }
        }
      }
    })
    
    if (!staybackRequest) {
      return NextResponse.json(
        { error: "Stayback request not found" },
        { status: 404 }
      )
    }
    
    // Check if all 3 approvals are APPROVED
    const validApprovals = staybackRequest.approvals.filter(
      approval => approval.staff || approval.hostel || approval.teamLead
    )
    
    const allApproved = validApprovals.length === 3 && 
                       validApprovals.every(approval => approval.status === "APPROVED")
    
    if (!allApproved) {
      return NextResponse.json(
        { error: "Cannot mark IN/OUT. Request is not fully approved by all 3 approvers." },
        { status: 400 }
      )
    }
    
    // ✅ Update ONLY security tracking fields for ALL approvals
    const updatePromises = validApprovals.map(approval =>
      prisma.staybackApproval.update({
        where: { id: approval.id },
        data: {
          securityStatus: status,
          securityCheckedBy: security.name,
          securityCheckedAt: new Date(),
        }
      })
    )
    
    await Promise.all(updatePromises)
    
    // Update the stayback request status
    await prisma.staybackRequest.update({
      where: { id: requestId },
      data: {
        status: status === "OUT" ? "APPROVED" : "APPROVED",
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({
      message: `Student marked as ${status} successfully`,
      securityStatus: status,
      securityCheckedBy: security.name,
      securityCheckedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error updating security tracking:", error)
    return NextResponse.json(
      { error: "Failed to update security tracking" },
      { status: 500 }
    )
  }
}