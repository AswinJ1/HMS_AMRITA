// app/api/security/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET security dashboard data - only show fully approved stayback requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
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
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Filter for fully approved requests (staff + hostel + team lead all approved)
    const fullyApprovedRequests = allRequests.filter(request => {
      const hasStaffApproval = request.approvals.some(approval => 
        approval.staffId && approval.status === "APPROVED"
      )
      const hasHostelApproval = request.approvals.some(approval => 
        approval.hostelId && approval.status === "APPROVED"
      )
      const hasTeamLeadApproval = request.approvals.some(approval => 
        approval.teamLeadId && approval.status === "APPROVED"
      )
      
      return hasStaffApproval && hasHostelApproval && hasTeamLeadApproval
    })
    
    // Add security status information to each request
    const requestsWithSecurityStatus = fullyApprovedRequests.map(request => {
      const securityApprovals = request.approvals.filter(approval => 
        approval.comments && approval.comments.includes(`SECURITY_TRACKING:${security.id}:`)
      )
      
      let securityStatus = null
      let securityComments = null
      let securityApprovedAt = null
      
      if (securityApprovals.length > 0) {
        // Get the most recent security approval
        const latestSecurityApproval = securityApprovals.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
        
        // Parse the security status from comments
        const match = latestSecurityApproval.comments?.match(/SECURITY_TRACKING:\d+:.* - (IN|OUT)/)
        if (match) {
          securityStatus = match[1]
        }
        
        securityComments = latestSecurityApproval.comments
        securityApprovedAt = latestSecurityApproval.approvedAt
      }
      
      return {
        ...request,
        securityStatus,
        securityComments,
        securityApprovedAt
      }
    })
    
    return NextResponse.json({
      requests: requestsWithSecurityStatus,
      total: requestsWithSecurityStatus.length
    })
  } catch (error) {
    console.error("Error fetching security data:", error)
    return NextResponse.json(
      { error: "Failed to fetch security data" },
      { status: 500 }
    )
  }
}

// POST - Update security approval status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SECURITY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { requestId, status, comments } = body
    
    if (!requestId || !status) {
      return NextResponse.json(
        { error: "Request ID and status are required" },
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
    
    // Find or create the security tracking approval record
    let securityApproval = await prisma.staybackApproval.findFirst({
      where: {
        requestId: requestId,
        comments: {
          startsWith: `SECURITY_TRACKING:${security.id}:`
        }
      }
    })
    
    if (!securityApproval) {
      // Create a new security tracking record if it doesn't exist
      securityApproval = await prisma.staybackApproval.create({
        data: {
          requestId: requestId,
          status: status === "IN" || status === "OUT" ? "APPROVED" : status,
          comments: comments ? 
            `SECURITY_TRACKING:${security.id}:${security.name} - ${status}: ${comments}` : 
            `SECURITY_TRACKING:${security.id}:${security.name} - ${status}`,
          approvedAt: new Date()
        }
      })
    } else {
      // Update the existing security approval status
      securityApproval = await prisma.staybackApproval.update({
        where: { id: securityApproval.id },
        data: {
          status: status === "IN" || status === "OUT" ? "APPROVED" : status, // Convert IN/OUT to APPROVED for database
          comments: comments ? 
            `SECURITY_TRACKING:${security.id}:${security.name} - ${status}: ${comments}` : 
            `SECURITY_TRACKING:${security.id}:${security.name} - ${status}`,
          approvedAt: new Date()
        }
      })
    }
    
    return NextResponse.json({
      message: `Security status updated to ${status} successfully`,
      approval: securityApproval
    })
  } catch (error) {
    console.error("Error updating security approval:", error)
    return NextResponse.json(
      { error: "Failed to update security approval" },
      { status: 500 }
    )
  }
}