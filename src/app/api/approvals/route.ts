// app/api/approvals/route.ts - Cascading approval logic

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const includeApprovalDetails = {
  request: {
    include: {
      student: {
        include: { user: { select: { email: true, uid: true } } },
      },
      teamLeadApplicant: {
        include: { user: { select: { email: true, uid: true } } },
      },
      approvals: {
        include: {
          teamLead: { select: { name: true, clubName: true } },
          staff: { select: { name: true, department: true } },
          hostel: { select: { name: true, hostelName: true } },
        },
      },
    },
  },
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { role } = session.user
    let approvals

    switch (role) {
      case "TEAM_LEAD": {
        const teamLead = await prisma.teamLead.findUnique({
          where: { userId: session.user.id },
        })
        if (!teamLead)
          return NextResponse.json({ error: "Team lead not found" }, { status: 404 })

        // Team lead sees requests assigned to them for approval
        approvals = await prisma.staybackApproval.findMany({
          where: { teamLeadId: teamLead.id },
          include: includeApprovalDetails,
          orderBy: { createdAt: "desc" },
        })
        break
      }

      case "STAFF": {
        const staff = await prisma.staff.findUnique({
          where: { userId: session.user.id },
        })
        if (!staff)
          return NextResponse.json({ error: "Staff not found" }, { status: 404 })

        // Staff sees ALL requests assigned to them regardless of stage
        // UI determines which are actionable (only STAFF_PENDING stage)
        approvals = await prisma.staybackApproval.findMany({
          where: { staffId: staff.id },
          include: includeApprovalDetails,
          orderBy: { createdAt: "desc" },
        })
        break
      }

      case "HOSTEL": {
        const hostel = await prisma.hostel.findUnique({
          where: { userId: session.user.id },
        })
        if (!hostel)
          return NextResponse.json({ error: "Hostel not found" }, { status: 404 })

        // Warden sees ALL requests assigned to them
        // Also auto-create missing hostel approval records for students in same hostel
        const studentRequestsMissing = await prisma.staybackRequest.findMany({
          where: {
            student: { hostelName: hostel.hostelName },
            approvals: { none: { hostelId: hostel.id } },
          },
        })

        if (studentRequestsMissing.length > 0) {
          await Promise.all(
            studentRequestsMissing.map((req) =>
              prisma.staybackApproval.create({
                data: { requestId: req.id, hostelId: hostel.id, status: "PENDING" },
              }).catch(() => null) // ignore duplicates
            )
          )
        }

        approvals = await prisma.staybackApproval.findMany({
          where: { hostelId: hostel.id },
          include: includeApprovalDetails,
          orderBy: { createdAt: "desc" },
        })
        break
      }

      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }

    return NextResponse.json(approvals)
  } catch (error) {
    console.error("Error fetching approvals:", error)
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { requestId, status, comments, approveWithoutSecurity } = body

    if (!requestId || !status)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    const { role } = session.user

    // Fetch the current request with its stage
    const currentRequest = await prisma.staybackRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true },
    })

    if (!currentRequest)
      return NextResponse.json({ error: "Request not found" }, { status: 404 })

    // --- TEAM LEAD approval ---
    if (role === "TEAM_LEAD") {
      if (currentRequest.stage !== "TEAM_LEAD_PENDING")
        return NextResponse.json(
          { error: "This request is not at the Team Lead approval stage" },
          { status: 400 }
        )

      const teamLead = await prisma.teamLead.findUnique({
        where: { userId: session.user.id },
      })
      if (!teamLead)
        return NextResponse.json({ error: "Team lead not found" }, { status: 404 })

      await prisma.staybackApproval.updateMany({
        where: { requestId, teamLeadId: teamLead.id },
        data: {
          status,
          comments: comments || null,
          approvedAt: status === "APPROVED" ? new Date() : null,
        },
      })

      if (status === "REJECTED") {
        await prisma.staybackRequest.update({
          where: { id: requestId },
          data: { stage: "REJECTED", status: "REJECTED" },
        })
      } else if (status === "APPROVED") {
        // Advance to STAFF_PENDING
        await prisma.staybackRequest.update({
          where: { id: requestId },
          data: { stage: "STAFF_PENDING" },
        })
      }
    }

    // --- STAFF approval ---
    else if (role === "STAFF") {
      if (currentRequest.stage !== "STAFF_PENDING")
        return NextResponse.json(
          { error: "This request is not at the Staff approval stage" },
          { status: 400 }
        )

      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
      })
      if (!staff)
        return NextResponse.json({ error: "Staff not found" }, { status: 404 })

      await prisma.staybackApproval.updateMany({
        where: { requestId, staffId: staff.id },
        data: {
          status,
          comments: comments || null,
          approvedAt: status === "APPROVED" ? new Date() : null,
        },
      })

      if (status === "REJECTED") {
        await prisma.staybackRequest.update({
          where: { id: requestId },
          data: { stage: "REJECTED", status: "REJECTED" },
        })
      } else if (status === "APPROVED") {
        // Advance to WARDEN_PENDING (security window opens here)
        await prisma.staybackRequest.update({
          where: { id: requestId },
          data: { stage: "WARDEN_PENDING" },
        })
      }
    }

    // --- HOSTEL (Warden) approval ---
    else if (role === "HOSTEL") {
      if (currentRequest.stage !== "WARDEN_PENDING")
        return NextResponse.json(
          { error: "This request is not at the Warden approval stage" },
          { status: 400 }
        )

      const hostel = await prisma.hostel.findUnique({
        where: { userId: session.user.id },
      })
      if (!hostel)
        return NextResponse.json({ error: "Hostel not found" }, { status: 404 })

      await prisma.staybackApproval.updateMany({
        where: { requestId, hostelId: hostel.id },
        data: {
          status,
          comments: comments || null,
          approvedAt: status === "APPROVED" ? new Date() : null,
        },
      })

      if (status === "REJECTED") {
        await prisma.staybackRequest.update({
          where: { id: requestId },
          data: { stage: "REJECTED", status: "REJECTED" },
        })
      } else if (status === "APPROVED") {
        // Warden can approve with or without security check
        await prisma.staybackRequest.update({
          where: { id: requestId },
          data: { stage: "COMPLETED", status: "APPROVED" },
        })
      }
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }

    return NextResponse.json({ message: "Approval updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating approval:", error)
    return NextResponse.json({ error: "Failed to update approval" }, { status: 500 })
  }
}
