// app/api/approvals/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { role } = session.user
    
    let approvals
    
    switch (role) {
      case "STAFF":
        const staff = await prisma.staff.findUnique({
          where: { userId: session.user.id },
        })
        if (!staff) {
          return NextResponse.json({ error: "Staff not found" }, { status: 404 })
        }
        
        // Get all stayback requests that need staff approval
        const staffRequests = await prisma.staybackRequest.findMany({
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
              where: {
                staffId: staff.id
              }
            }
          },
          orderBy: { createdAt: "desc" },
        })
        
        // Transform to include approval status for this staff member
        approvals = staffRequests.map(request => {
          const staffApproval = request.approvals[0] // There should be only one approval per staff
          return {
            id: staffApproval?.id || `pending_${request.id}`,
            requestId: request.id,
            status: staffApproval?.status || "PENDING",
            comments: staffApproval?.comments || null,
            approvedAt: staffApproval?.approvedAt || null,
            request: {
              id: request.id,
              clubName: request.clubName,
              date: request.date,
              fromTime: request.fromTime,
              toTime: request.toTime,
              remarks: request.remarks,
              status: request.status,
              createdAt: request.createdAt,
              student: request.student
            }
          }
        })
        break
        
      case "HOSTEL":
        const hostel = await prisma.hostel.findUnique({
          where: { userId: session.user.id },
        })
        if (!hostel) {
          return NextResponse.json({ error: "Hostel not found" }, { status: 404 })
        }
        
        // Get all stayback requests from students in this hostel
        const hostelRequests = await prisma.staybackRequest.findMany({
          where: {
            student: {
              hostelName: hostel.hostelName
            }
          },
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
              where: {
                hostelId: hostel.id
              }
            }
          },
          orderBy: { createdAt: "desc" },
        })
        
        // Transform to include approval status for this hostel
        approvals = hostelRequests.map(request => {
          const hostelApproval = request.approvals[0]
          return {
            id: hostelApproval?.id || `pending_${request.id}`,
            requestId: request.id,
            status: hostelApproval?.status || "PENDING",
            comments: hostelApproval?.comments || null,
            approvedAt: hostelApproval?.approvedAt || null,
            request: {
              id: request.id,
              clubName: request.clubName,
              date: request.date,
              fromTime: request.fromTime,
              toTime: request.toTime,
              remarks: request.remarks,
              status: request.status,
              createdAt: request.createdAt,
              student: request.student
            }
          }
        })
        break
        
      case "TEAM_LEAD":
        const teamLead = await prisma.teamLead.findUnique({
          where: { userId: session.user.id },
        })
        if (!teamLead) {
          return NextResponse.json({ error: "Team Lead not found" }, { status: 404 })
        }
        
        // Get all stayback requests for this team lead's club
        const teamLeadRequests = await prisma.staybackRequest.findMany({
          where: {
            clubName: teamLead.clubName
          },
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
              where: {
                teamLeadId: teamLead.id
              }
            }
          },
          orderBy: { createdAt: "desc" },
        })
        
        // Transform to include approval status for this team lead
        approvals = teamLeadRequests.map(request => {
          const teamLeadApproval = request.approvals[0]
          return {
            id: teamLeadApproval?.id || `pending_${request.id}`,
            requestId: request.id,
            status: teamLeadApproval?.status || "PENDING",
            comments: teamLeadApproval?.comments || null,
            approvedAt: teamLeadApproval?.approvedAt || null,
            request: {
              id: request.id,
              clubName: request.clubName,
              date: request.date,
              fromTime: request.fromTime,
              toTime: request.toTime,
              remarks: request.remarks,
              status: request.status,
              createdAt: request.createdAt,
              student: request.student
            }
          }
        })
        break
        
      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }
    
    return NextResponse.json(approvals)
  } catch (error) {
    console.error("Error fetching approvals:", error)
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { requestId, status, comments } = body
    
    if (!requestId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const { role } = session.user
    let approvalUpdate
    
    switch (role) {
      case "STAFF":
        const staff = await prisma.staff.findUnique({
          where: { userId: session.user.id },
        })
        if (!staff) {
          return NextResponse.json({ error: "Staff not found" }, { status: 404 })
        }
        
        // Check if approval record exists
        const existingStaffApproval = await prisma.staybackApproval.findUnique({
          where: {
            requestId_staffId: {
              requestId: requestId,
              staffId: staff.id,
            },
          },
        })
        
        if (existingStaffApproval) {
          // Update existing approval
          approvalUpdate = await prisma.staybackApproval.update({
            where: {
              requestId_staffId: {
                requestId: requestId,
                staffId: staff.id,
              },
            },
            data: {
              status: status,
              comments: comments,
              approvedAt: status === "APPROVED" ? new Date() : null,
            },
          })
        } else {
          // Create new approval record
          approvalUpdate = await prisma.staybackApproval.create({
            data: {
              requestId: requestId,
              staffId: staff.id,
              status: status,
              comments: comments,
              approvedAt: status === "APPROVED" ? new Date() : null,
            },
          })
        }
        break
        
      case "HOSTEL":
        const hostel = await prisma.hostel.findUnique({
          where: { userId: session.user.id },
        })
        if (!hostel) {
          return NextResponse.json({ error: "Hostel not found" }, { status: 404 })
        }
        
        const existingHostelApproval = await prisma.staybackApproval.findUnique({
          where: {
            requestId_hostelId: {
              requestId: requestId,
              hostelId: hostel.id,
            },
          },
        })
        
        if (existingHostelApproval) {
          approvalUpdate = await prisma.staybackApproval.update({
            where: {
              requestId_hostelId: {
                requestId: requestId,
                hostelId: hostel.id,
              },
            },
            data: {
              status: status,
              comments: comments,
              approvedAt: status === "APPROVED" ? new Date() : null,
            },
          })
        } else {
          approvalUpdate = await prisma.staybackApproval.create({
            data: {
              requestId: requestId,
              hostelId: hostel.id,
              status: status,
              comments: comments,
              approvedAt: status === "APPROVED" ? new Date() : null,
            },
          })
        }
        break
        
      case "TEAM_LEAD":
        const teamLead = await prisma.teamLead.findUnique({
          where: { userId: session.user.id },
        })
        if (!teamLead) {
          return NextResponse.json({ error: "Team Lead not found" }, { status: 404 })
        }
        
        const existingTeamLeadApproval = await prisma.staybackApproval.findUnique({
          where: {
            requestId_teamLeadId: {
              requestId: requestId,
              teamLeadId: teamLead.id,
            },
          },
        })
        
        if (existingTeamLeadApproval) {
          approvalUpdate = await prisma.staybackApproval.update({
            where: {
              requestId_teamLeadId: {
                requestId: requestId,
                teamLeadId: teamLead.id,
              },
            },
            data: {
              status: status,
              comments: comments,
              approvedAt: status === "APPROVED" ? new Date() : null,
            },
          })
        } else {
          approvalUpdate = await prisma.staybackApproval.create({
            data: {
              requestId: requestId,
              teamLeadId: teamLead.id,
              status: status,
              comments: comments,
              approvedAt: status === "APPROVED" ? new Date() : null,
            },
          })
        }
        break
        
      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }
    
    // Check if all approvals are completed and update request status
    const allApprovals = await prisma.staybackApproval.findMany({
      where: { requestId: requestId },
    })
    
    // Count how many approvers are needed (staff, hostel, team lead)
    const request = await prisma.staybackRequest.findUnique({
      where: { id: requestId },
      include: {
        student: true
      }
    })
    
    if (request) {
      // Check if we have approvals from all required parties
      const hasStaffApproval = allApprovals.some(a => a.staffId && a.status === "APPROVED")
      const hasHostelApproval = allApprovals.some(a => a.hostelId && a.status === "APPROVED")
      const hasTeamLeadApproval = allApprovals.some(a => a.teamLeadId && a.status === "APPROVED")
      const anyRejected = allApprovals.some(a => a.status === "REJECTED")
      
      if (anyRejected) {
        await prisma.staybackRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED" },
        })
      } else if (hasStaffApproval && hasHostelApproval && hasTeamLeadApproval) {
        await prisma.staybackRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" },
        })
      }
    }
    
    return NextResponse.json(
      { message: "Approval updated successfully", approval: approvalUpdate },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating approval:", error)
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    )
  }
}