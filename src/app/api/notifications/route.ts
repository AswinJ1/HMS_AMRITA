import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 })
    }

    const userId = session.user.id
    const role = session.user.role
    const notifications: any[] = []

    // Fetch relevant stayback data based on role
    if (role === "STUDENT") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { student: { include: { staybackRequests: { orderBy: { updatedAt: "desc" }, take: 10 } } } },
      })
      const requests = user?.student?.staybackRequests || []
      for (const req of requests) {
        const stageLabels: Record<string, string> = {
          TEAM_LEAD_PENDING: "Waiting for Team Lead approval",
          STAFF_PENDING: "Waiting for Staff approval",
          WARDEN_PENDING: "Waiting for Warden approval",
          COMPLETED: "Request approved — all stages cleared",
          REJECTED: "Request was rejected",
        }
        const type = req.stage === "COMPLETED" ? "approval" : req.stage === "REJECTED" ? "rejection" : "pending"
        notifications.push({
          id: req.id,
          title: `Stayback — ${req.clubName}`,
          message: stageLabels[req.stage] || req.stage,
          type,
          time: formatTimeAgo(req.updatedAt),
          read: req.stage === "COMPLETED" || req.stage === "REJECTED",
        })
      }
    }

    if (role === "TEAM_LEAD") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { teamLead: true },
      })
      if (user?.teamLead) {
        const pendingApprovals = await prisma.staybackApproval.findMany({
          where: { teamLeadId: user.teamLead.id, status: "PENDING" },
          include: { request: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
        for (const ap of pendingApprovals) {
          notifications.push({
            id: ap.id,
            title: "Pending Approval",
            message: `Stayback request for ${ap.request.clubName} needs your review`,
            type: "info" as const,
            time: formatTimeAgo(ap.createdAt),
            read: false,
          })
        }
      }
    }

    if (role === "STAFF") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { staff: true },
      })
      if (user?.staff) {
        const pendingApprovals = await prisma.staybackApproval.findMany({
          where: { staffId: user.staff.id, status: "PENDING" },
          include: { request: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
        for (const ap of pendingApprovals) {
          if (ap.request && ap.request.stage === "STAFF_PENDING") {
            notifications.push({
              id: ap.id,
              title: "Staff Approval Needed",
              message: `Stayback for ${ap.request.clubName} awaits your approval`,
              type: "info" as const,
              time: formatTimeAgo(ap.createdAt),
              read: false,
            })
          }
        }
      }
    }

    if (role === "HOSTEL") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { hostel: true },
      })
      if (user?.hostel) {
        const pendingApprovals = await prisma.staybackApproval.findMany({
          where: { hostelId: user.hostel.id, status: "PENDING" },
          include: { request: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
        for (const ap of pendingApprovals) {
          if (ap.request && ap.request.stage === "WARDEN_PENDING") {
            notifications.push({
              id: ap.id,
              title: "Warden Approval Needed",
              message: `Stayback for ${ap.request.clubName} awaits your approval`,
              type: "info" as const,
              time: formatTimeAgo(ap.createdAt),
              read: false,
            })
          }
        }
      }
    }

    if (role === "ADMIN") {
      const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      })
      for (const u of recentUsers) {
        notifications.push({
          id: u.id,
          title: "New User Registered",
          message: `${u.email} joined as ${u.role.replace("_", " ")}`,
          type: "info" as const,
          time: formatTimeAgo(u.createdAt),
          read: true,
        })
      }
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Notifications error:", error)
    return NextResponse.json([], { status: 200 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
