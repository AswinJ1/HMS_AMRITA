// app/api/stayback/route.ts - Cascading approval flow

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { staybackRequestSchema } from "@/lib/validations/stayback"
import { z } from "zod"

async function retryQuery<T>(queryFn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn()
    } catch (error: any) {
      if (error.code === "P1001" && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
        continue
      }
      throw error
    }
  }
  throw new Error("Max retries exceeded")
}

// GET: Fetch stayback requests for the current student or team-lead applicant
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { role } = session.user

    if (role === "STUDENT") {
      const student = await retryQuery(() =>
        prisma.student.findUnique({ where: { userId: session.user.id } })
      )
      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

      const requests = await retryQuery(() =>
        prisma.staybackRequest.findMany({
          where: { studentId: student.id },
          include: {
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
      )
      return NextResponse.json(requests)
    }

    if (role === "TEAM_LEAD") {
      const teamLead = await retryQuery(() =>
        prisma.teamLead.findUnique({ where: { userId: session.user.id } })
      )
      if (!teamLead) return NextResponse.json({ error: "Team lead not found" }, { status: 404 })

      const requests = await retryQuery(() =>
        prisma.staybackRequest.findMany({
          where: { teamLeadApplicantId: teamLead.id },
          include: {
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
      )
      return NextResponse.json(requests)
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  } catch (error) {
    console.error("Error fetching stayback requests:", error)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}

// POST: Create stayback request (student or team lead)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { staffId, hostelId, teamLeadId, applicantType, ...requestData } = body
    const role = session.user.role

    const validatedData = staybackRequestSchema.parse({
      clubName: requestData.clubName,
      date: new Date(requestData.date),
      fromTime: requestData.fromTime,
      toTime: requestData.toTime,
      remarks: requestData.remarks,
    })

    const isTeamLeadApplicant = role === "TEAM_LEAD" || applicantType === "team_lead"

    if (isTeamLeadApplicant) {
      // Team Lead applies for themselves – skip team-lead approval step
      const teamLeadUser = await retryQuery(() =>
        prisma.teamLead.findUnique({ where: { userId: session.user.id } })
      )
      if (!teamLeadUser)
        return NextResponse.json({ error: "Team lead profile not found" }, { status: 404 })

      if (!staffId || !hostelId)
        return NextResponse.json({ error: "Staff and Hostel Warden are required" }, { status: 400 })

      const staybackRequest = await retryQuery(() =>
        prisma.staybackRequest.create({
          data: {
            teamLeadApplicantId: teamLeadUser.id,
            clubName: validatedData.clubName,
            date: validatedData.date,
            fromTime: validatedData.fromTime,
            toTime: validatedData.toTime,
            remarks: validatedData.remarks,
            status: "PENDING",
            stage: "STAFF_PENDING",
          },
        })
      )

      await Promise.all([
        retryQuery(() =>
          prisma.staybackApproval.create({
            data: { requestId: staybackRequest.id, staffId, status: "PENDING" },
          })
        ),
        retryQuery(() =>
          prisma.staybackApproval.create({
            data: { requestId: staybackRequest.id, hostelId, status: "PENDING" },
          })
        ),
      ])

      return NextResponse.json(
        { message: "Team lead stayback request created", id: staybackRequest.id },
        { status: 201 }
      )
    } else {
      // Student applies – full cascading flow
      if (role !== "STUDENT")
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

      const student = await retryQuery(() =>
        prisma.student.findUnique({ where: { userId: session.user.id } })
      )
      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

      if (!staffId || !hostelId || !teamLeadId)
        return NextResponse.json(
          { error: "Team Lead, Staff, and Hostel Warden are all required" },
          { status: 400 }
        )

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
            stage: "TEAM_LEAD_PENDING",
          },
        })
      )

      await Promise.all([
        retryQuery(() =>
          prisma.staybackApproval.create({
            data: { requestId: staybackRequest.id, teamLeadId, status: "PENDING" },
          })
        ),
        retryQuery(() =>
          prisma.staybackApproval.create({
            data: { requestId: staybackRequest.id, staffId, status: "PENDING" },
          })
        ),
        retryQuery(() =>
          prisma.staybackApproval.create({
            data: { requestId: staybackRequest.id, hostelId, status: "PENDING" },
          })
        ),
      ])

      return NextResponse.json(
        { message: "Stayback request created", id: staybackRequest.id },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error("Error creating stayback request:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 })
  }
}
