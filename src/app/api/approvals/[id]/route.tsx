import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { status, comments } = body
    
    console.log(`🔄 Updating approval ${params.id} with status: ${status}`)
    
    // Validate status
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    
    // Find the approval record
    const approval = await prisma.staybackApproval.findUnique({
      where: { id: params.id },
      include: {
        request: {
          include: {
            student: true
          }
        }
      }
    })
    
    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 })
    }
    
    // Check if user has permission to update this approval
    let hasPermission = false
    
    if (session.user.role === "STAFF" && approval.staffId) {
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id }
      })
      hasPermission = staff?.id === approval.staffId
    } else if (session.user.role === "HOSTEL" && approval.hostelId) {
      const hostel = await prisma.hostel.findUnique({
        where: { userId: session.user.id }
      })
      hasPermission = hostel?.id === approval.hostelId
    } else if (session.user.role === "TEAM_LEAD" && approval.teamLeadId) {
      const teamLead = await prisma.teamLead.findUnique({
        where: { userId: session.user.id }
      })
      hasPermission = teamLead?.id === approval.teamLeadId
    }
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    // Update the approval
    const updatedApproval = await prisma.staybackApproval.update({
      where: { id: params.id },
      data: {
        status,
        comments: comments || null,
        approvedAt: status === "APPROVED" ? new Date() : null,
      },
    })
    
    console.log(`✅ Approval ${params.id} updated successfully`)
    
    return NextResponse.json(updatedApproval)
  } catch (error) {
    console.error("Error updating approval:", error)
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    )
  }
}