// app/api/security/route.ts - Security marks IN/OUT after staff approval

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Show requests at WARDEN_PENDING or COMPLETED stage for security monitoring
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SECURITY")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const security = await prisma.security.findUnique({
      where: { userId: session.user.id },
    })
    if (!security)
      return NextResponse.json({ error: "Security user not found" }, { status: 404 })

    // Fetch requests where staff has approved (WARDEN_PENDING) or completed
    const requests = await prisma.staybackRequest.findMany({
      where: {
        stage: { in: ["WARDEN_PENDING", "COMPLETED"] },
      },
      include: {
        student: {
          include: { user: { select: { email: true, uid: true } } },
        },
        teamLeadApplicant: {
          include: { user: { select: { email: true, uid: true } } },
        },
        approvals: {
          include: {
            staff: { select: { name: true, department: true } },
            hostel: { select: { name: true, hostelName: true } },
            teamLead: { select: { name: true, clubName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedRequests = requests.map((req) => ({
      id: req.id,
      student: req.student,
      teamLeadApplicant: req.teamLeadApplicant,
      applicantName: req.student?.name || req.teamLeadApplicant?.name || "Unknown",
      applicantType: req.studentId ? "student" : "team_lead",
      clubName: req.clubName,
      date: req.date,
      fromTime: req.fromTime,
      toTime: req.toTime,
      remarks: req.remarks,
      stage: req.stage,
      status: req.status,
      securityStatus: req.securityStatus || "PENDING",
      securityCheckedBy: req.securityCheckedBy,
      securityCheckedAt: req.securityCheckedAt,
      approvals: req.approvals,
      createdAt: req.createdAt,
    }))

    return NextResponse.json({
      requests: formattedRequests,
      securityUser: { id: security.id, name: security.name, department: security.department },
      totalRequests: formattedRequests.length,
    })
  } catch (error) {
    console.error("Error fetching security data:", error)
    return NextResponse.json({ error: "Failed to fetch security data" }, { status: 500 })
  }
}

// POST: Mark student/team-lead as IN or OUT
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "SECURITY")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { requestId, status } = body

    if (!requestId || !status || !["IN", "OUT"].includes(status))
      return NextResponse.json(
        { error: "Request ID and valid status (IN or OUT) are required" },
        { status: 400 }
      )

    const security = await prisma.security.findUnique({
      where: { userId: session.user.id },
    })
    if (!security)
      return NextResponse.json({ error: "Security user not found" }, { status: 404 })

    const staybackRequest = await prisma.staybackRequest.findUnique({
      where: { id: requestId },
    })
    if (!staybackRequest)
      return NextResponse.json({ error: "Stayback request not found" }, { status: 404 })

    // Only allow marking IN/OUT for WARDEN_PENDING or COMPLETED
    if (!["WARDEN_PENDING", "COMPLETED"].includes(staybackRequest.stage))
      return NextResponse.json(
        { error: "Cannot mark IN/OUT. Staff has not approved this request yet." },
        { status: 400 }
      )

    // Update security tracking on the request itself
    await prisma.staybackRequest.update({
      where: { id: requestId },
      data: {
        securityStatus: status,
        securityCheckedBy: security.name,
        securityCheckedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `Marked as ${status} successfully`,
      securityStatus: status,
      securityCheckedBy: security.name,
      securityCheckedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating security tracking:", error)
    return NextResponse.json({ error: "Failed to update security tracking" }, { status: 500 })
  }
}
