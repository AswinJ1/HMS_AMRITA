// app/api/security/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET security dashboard data and stayback requests for monitoring
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role as string) !== "SECURITY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get security user profile
    const security = await prisma.security.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!security) {
      return NextResponse.json({ error: "Security user not found" }, { status: 404 })
    }
    
    // 🟢 CHANGE: Get ALL security tracking approvals, not just for this security user
    const securityApprovals = await prisma.staybackApproval.findMany({
      where: {
        comments: {
          startsWith: `SECURITY_TRACKING:`  // Remove the specific security.id filter
        }
      },
      include: {
        request: {
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
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    // Transform the data to make it easier for the frontend
    const requests = securityApprovals.map(approval => {
      // Extract IN/OUT status from security comments
      const statusMatch = approval.comments?.match(/SECURITY_TRACKING:\w+:[^-]+ - (IN|OUT|APPROVED|REJECTED)/)
      const securityStatus = statusMatch ? statusMatch[1] : approval.status
      
      return {
        id: approval.request.id,
        student: approval.request.student,
        clubName: approval.request.clubName,
        date: approval.request.date,
        fromTime: approval.request.fromTime,
        toTime: approval.request.toTime,
        remarks: approval.request.remarks,
        status: approval.request.status,
        createdAt: approval.request.createdAt,
        updatedAt: approval.request.updatedAt,
        securityStatus: securityStatus, // Use extracted status
        securityComments: approval.comments,
        securityApprovedAt: approval.approvedAt,
        approvals: approval.request.approvals.filter(a => !a.comments?.startsWith('SECURITY_TRACKING')), // Hide security tracking from normal approvals
      }
    })
    
    return NextResponse.json({
      requests,
      securityUser: {
        id: security.id,
        name: security.name,
        department: security.department
      }
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
    const session = await auth()
    
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
    
    // Find the security tracking approval record
    const securityApproval = await prisma.staybackApproval.findFirst({
      where: {
        requestId: requestId,
        comments: {
          startsWith: `SECURITY_TRACKING:${security.id}:`
        }
      }
    })
    
    if (!securityApproval) {
      return NextResponse.json(
        { error: "Security tracking record not found" },
        { status: 404 }
      )
    }
    
    // Update the security approval status
    const updatedApproval = await prisma.staybackApproval.update({
      where: { id: securityApproval.id },
      data: {
        status: status === "IN" || status === "OUT" ? "APPROVED" : status, // Convert IN/OUT to APPROVED for database
        comments: comments ? 
          `SECURITY_TRACKING:${security.id}:${security.name} - ${status}: ${comments}` : 
          `SECURITY_TRACKING:${security.id}:${security.name} - ${status}`,
        approvedAt: new Date()
      }
    })
    
    // If status is IN or OUT, we need to notify Team Lead and Staff
    if (status === "IN" || status === "OUT") {
      try {
        // Get the stayback request with all approvals
        const staybackRequest = await prisma.staybackRequest.findUnique({
          where: { id: requestId },
          include: {
            student: {
              include: {
                user: true
              }
            },
            approvals: {
              include: {
                staff: {
                  include: {
                    user: true
                  }
                },
                teamLead: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        })
        
        if (staybackRequest) {
          // Update relevant staff and team lead approvals with security status notification
          const notificationPromises = []
          
          // Notify Staff
          const staffApprovals = staybackRequest.approvals.filter(a => a.staffId)
          for (const staffApproval of staffApprovals) {
            notificationPromises.push(
              prisma.staybackApproval.update({
                where: { id: staffApproval.id },
                data: {
                  comments: `${staffApproval.comments || ''}\n[SECURITY UPDATE] Student marked as ${status} by Security: ${security.name}${comments ? ` - ${comments}` : ''}`
                }
              })
            )
          }
          
          // Notify Team Lead
          const teamLeadApprovals = staybackRequest.approvals.filter(a => a.teamLeadId)
          for (const teamLeadApproval of teamLeadApprovals) {
            notificationPromises.push(
              prisma.staybackApproval.update({
                where: { id: teamLeadApproval.id },
                data: {
                  comments: `${teamLeadApproval.comments || ''}\n[SECURITY UPDATE] Student marked as ${status} by Security: ${security.name}${comments ? ` - ${comments}` : ''}`
                }
              })
            )
          }
          
          // Execute all notifications
          await Promise.all(notificationPromises)
        }
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError)
        // Don't fail the main request if notifications fail
      }
    }
    
    return NextResponse.json({
      message: `Security status updated to ${status} successfully`,
      approval: updatedApproval,
      notified: status === "IN" || status === "OUT" ? "Staff and Team Lead notified" : "No notifications sent"
    })
  } catch (error) {
    console.error("Error updating security approval:", error)
    return NextResponse.json(
      { error: "Failed to update security approval" },
      { status: 500 }
    )
  }
}