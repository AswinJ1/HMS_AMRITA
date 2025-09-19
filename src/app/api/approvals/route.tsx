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
    console.log(`🔍 Fetching approvals for role: ${role}`)
    
    let approvals
    
    switch (role) {
      case "STAFF":
        const staff = await prisma.staff.findUnique({
          where: { userId: session.user.id },
        })
        if (!staff) {
          return NextResponse.json({ error: "Staff not found" }, { status: 404 })
        }
        
        console.log(`👤 Found staff: ${staff.name} (ID: ${staff.id})`)
        
        // Get all stayback approvals for this staff member
        approvals = await prisma.staybackApproval.findMany({
          where: { 
            staffId: staff.id 
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
                }
              }
            }
          },
          orderBy: { createdAt: "desc" },
        })
        
        console.log(`✅ Found ${approvals.length} staff approvals`)
        break
        
      case "HOSTEL":
        const hostel = await prisma.hostel.findUnique({
          where: { userId: session.user.id },
        })
        if (!hostel) {
          return NextResponse.json({ error: "Hostel not found" }, { status: 404 })
        }
        
        console.log(`🏠 Found hostel: ${hostel.hostelName} (ID: ${hostel.id})`)
        
        // First, let's see what stayback requests exist for this hostel
        const allRequestsForHostel = await prisma.staybackRequest.findMany({
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
            }
          }
        })
        
        console.log(`📋 Found ${allRequestsForHostel.length} total requests for hostel ${hostel.hostelName}`)
        
        // Check existing approval records
        const existingApprovals = await prisma.staybackApproval.findMany({
          where: {
            hostelId: hostel.id
          }
        })
        
        console.log(`✅ Found ${existingApprovals.length} existing approval records for this hostel`)
        
        // Create missing approval records for requests that don't have them
        const requestsNeedingApprovals = allRequestsForHostel.filter(request => 
          !existingApprovals.some(approval => approval.requestId === request.id)
        )
        
        if (requestsNeedingApprovals.length > 0) {
          console.log(`⚠️ Creating ${requestsNeedingApprovals.length} missing approval records...`)
          
          const missingApprovals = await Promise.all(
            requestsNeedingApprovals.map(request =>
              prisma.staybackApproval.create({
                data: {
                  requestId: request.id,
                  hostelId: hostel.id,
                  status: "PENDING",
                }
              })
            )
          )
          
          console.log(`✅ Created ${missingApprovals.length} missing approval records`)
        }
        
        // Now get all approvals for this hostel
        approvals = await prisma.staybackApproval.findMany({
          where: { 
            hostelId: hostel.id 
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
                }
              }
            }
          },
          orderBy: { createdAt: "desc" },
        })
        
        console.log(`✅ Returning ${approvals.length} hostel approvals`)
        break
        
      case "TEAM_LEAD":
        const teamLead = await prisma.teamLead.findUnique({
          where: { userId: session.user.id },
        })
        if (!teamLead) {
          return NextResponse.json({ error: "Team lead not found" }, { status: 404 })
        }
        
        console.log(`👥 Found team lead: ${teamLead.name} for club: ${teamLead.clubName}`)
        
        // Get all stayback approvals for this team lead
        approvals = await prisma.staybackApproval.findMany({
          where: { 
            teamLeadId: teamLead.id 
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
                }
              }
            }
          },
          orderBy: { createdAt: "desc" },
        })
        
        console.log(`✅ Found ${approvals.length} team lead approvals`)
        break
        
      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }
    
    return NextResponse.json(approvals)
  } catch (error) {
    console.error("❌ Error fetching approvals:", error)
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
    
    console.log(`🔄 Updating approval for request ${requestId} with status: ${status}`)
    
    if (!requestId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const { role } = session.user
    let approvalUpdate
    
    switch (role) {
      case "STAFF":
        const staff = await prisma.staff.findUnique({
          where: { userId: session.user.id }
        })
        if (!staff) {
          return NextResponse.json({ error: "Staff not found" }, { status: 404 })
        }
        
        approvalUpdate = await prisma.staybackApproval.updateMany({
          where: {
            requestId: requestId,
            staffId: staff.id
          },
          data: {
            status,
            comments: comments || null,
            approvedAt: status === "APPROVED" ? new Date() : null,
          },
        })
        break
        
      case "HOSTEL":
        const hostel = await prisma.hostel.findUnique({
          where: { userId: session.user.id }
        })
        if (!hostel) {
          return NextResponse.json({ error: "Hostel not found" }, { status: 404 })
        }
        
        approvalUpdate = await prisma.staybackApproval.updateMany({
          where: {
            requestId: requestId,
            hostelId: hostel.id
          },
          data: {
            status,
            comments: comments || null,
            approvedAt: status === "APPROVED" ? new Date() : null,
          },
        })
        break
        
      case "TEAM_LEAD":
        const teamLead = await prisma.teamLead.findUnique({
          where: { userId: session.user.id }
        })
        if (!teamLead) {
          return NextResponse.json({ error: "Team lead not found" }, { status: 404 })
        }
        
        approvalUpdate = await prisma.staybackApproval.updateMany({
          where: {
            requestId: requestId,
            teamLeadId: teamLead.id
          },
          data: {
            status,
            comments: comments || null,
            approvedAt: status === "APPROVED" ? new Date() : null,
          },
        })
        break
        
      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }
    
    console.log(`✅ Updated ${approvalUpdate.count} approval record(s)`)
    
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
          data: { status: "REJECTED" }
        })
        console.log(`❌ Request ${requestId} marked as REJECTED`)
      } else if (hasStaffApproval && hasHostelApproval && hasTeamLeadApproval) {
        await prisma.staybackRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" }
        })
        console.log(`✅ Request ${requestId} marked as APPROVED`)
      }
    }
    
    return NextResponse.json(
      { message: "Approval updated successfully", approval: approvalUpdate },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Error updating approval:", error)
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    )
  }
}