import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/settings — live system stats
export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // User counts by role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    })

    // Request counts by stage
    const requestsByStage = await prisma.staybackRequest.groupBy({
      by: ["stage"],
      _count: true,
    })

    // Total counts
    const totalUsers = await prisma.user.count()
    const totalRequests = await prisma.staybackRequest.count()

    return NextResponse.json({
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr.role] = curr._count
        return acc
      }, {} as Record<string, number>),
      requestsByStage: requestsByStage.reduce((acc, curr) => {
        acc[curr.stage] = curr._count
        return acc
      }, {} as Record<string, number>),
      totalUsers,
      totalRequests,
    })
  } catch (error) {
    console.error("Error fetching settings stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

// POST /api/admin/settings — admin actions (purge old requests)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, days } = body

    if (action === "purge") {
      if (!days || days < 1) {
        return NextResponse.json({ error: "Days must be at least 1" }, { status: 400 })
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      // Only purge COMPLETED or REJECTED requests older than cutoff
      const deleted = await prisma.staybackRequest.deleteMany({
        where: {
          stage: { in: ["COMPLETED", "REJECTED"] },
          createdAt: { lt: cutoffDate },
        },
      })

      return NextResponse.json({
        message: `Purged ${deleted.count} old requests`,
        count: deleted.count,
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Error in admin settings action:", error)
    return NextResponse.json({ error: "Action failed" }, { status: 500 })
  }
}
