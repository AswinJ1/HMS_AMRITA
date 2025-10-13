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
      // Get only valid approvals (exclude any orphaned approvals)
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
      
      // Check if security has already tracked this request
      const securityTracking = request.approvals.find(
        approval => approval.comments?.startsWith('SECURITY_TRACKING:')
      )
      
      let securityStatus = "PENDING"
      let securityComments = null
      let securityApprovedAt = null
      
      if (securityTracking) {
        // Extract IN/OUT status from security comments
        const statusMatch = securityTracking.comments?.match(/SECURITY_TRACKING:\w+:[^-]+ - (IN|OUT)/)
        securityStatus = statusMatch ? statusMatch[1] : securityTracking.status
        securityComments = securityTracking.comments
        securityApprovedAt = securityTracking.approvedAt
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
        securityComments: securityComments,
        securityApprovedAt: securityApprovedAt,
        approvals: validApprovals, // Show all 3 approvals to security
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
    const { requestId, status, comments } = body
    
    // Validate status - only IN or OUT allowed
    if (!requestId || !status || !["IN", "OUT"].includes(status)) {
      return NextResponse.json(
        { error: "Request ID and valid status (IN or OUT) are required" },
        { status: 400 }
      )
    }
    
    // Get security user profile
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
    
    // Check if security tracking already exists
    const existingSecurityTracking = staybackRequest.approvals.find(
      approval => approval.comments?.startsWith('SECURITY_TRACKING:')
    )
    
    let securityApproval
    
    if (existingSecurityTracking) {
      // Update existing security tracking
      securityApproval = await prisma.staybackApproval.update({
        where: { id: existingSecurityTracking.id },
        data: {
          status: "APPROVED",
          comments: comments ? 
            `SECURITY_TRACKING:${security.id}:${security.name} - ${status}: ${comments}` : 
            `SECURITY_TRACKING:${security.id}:${security.name} - ${status}`,
          approvedAt: new Date()
        }
      })
    } else {
      // Create new security tracking approval
      securityApproval = await prisma.staybackApproval.create({
        data: {
          requestId: requestId,
          status: "APPROVED",
          comments: comments ? 
            `SECURITY_TRACKING:${security.id}:${security.name} - ${status}: ${comments}` : 
            `SECURITY_TRACKING:${security.id}:${security.name} - ${status}`,
          approvedAt: new Date()
        }
      })
    }
    
    // Update the stayback request status to indicate security has tracked it
    await prisma.staybackRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        updatedAt: new Date()
      }
    })
    
    // Notify Team Lead and Staff about the security update
    try {
      const notificationPromises = []
      
      // Notify Staff
      const staffApprovals = validApprovals.filter(a => a.staffId)
      for (const staffApproval of staffApprovals) {
        notificationPromises.push(
          prisma.staybackApproval.update({
            where: { id: staffApproval.id },
            data: {
              comments: `${staffApproval.comments || ''}\n[SECURITY UPDATE] Student marked as ${status} by Security: ${security.name} at ${new Date().toLocaleString()}${comments ? ` - ${comments}` : ''}`
            }
          })
        )
      }
      
      // Notify Team Lead
      const teamLeadApprovals = validApprovals.filter(a => a.teamLeadId)
      for (const teamLeadApproval of teamLeadApprovals) {
        notificationPromises.push(
          prisma.staybackApproval.update({
            where: { id: teamLeadApproval.id },
            data: {
              comments: `${teamLeadApproval.comments || ''}\n[SECURITY UPDATE] Student marked as ${status} by Security: ${security.name} at ${new Date().toLocaleString()}${comments ? ` - ${comments}` : ''}`
            }
          })
        )
      }
      
      // Notify Hostel
      const hostelApprovals = validApprovals.filter(a => a.hostelId)
      for (const hostelApproval of hostelApprovals) {
        notificationPromises.push(
          prisma.staybackApproval.update({
            where: { id: hostelApproval.id },
            data: {
              comments: `${hostelApproval.comments || ''}\n[SECURITY UPDATE] Student marked as ${status} by Security: ${security.name} at ${new Date().toLocaleString()}${comments ? ` - ${comments}` : ''}`
            }
          })
        )
      }
      
      await Promise.all(notificationPromises)
    } catch (notificationError) {
      console.error("Error sending notifications:", notificationError)
    }
    
    return NextResponse.json({
      message: `Student marked as ${status} successfully`,
      approval: securityApproval,
      requestStatus: status === "OUT" ? "COMPLETED" : "APPROVED",
      notified: "Staff, Team Lead, and Hostel have been notified"
    })
  } catch (error) {
    console.error("Error updating security tracking:", error)
    return NextResponse.json(
      { error: "Failed to update security tracking" },
      { status: 500 }
    )
  }
}