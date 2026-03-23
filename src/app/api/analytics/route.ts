// app/api/analytics/route.ts - Dashboard analytics data with configurable date range

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "STAFF", "HOSTEL"].includes(session.user.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get("days") || "7"), 90) // max 90 days

    // Requests by stage (for pie chart)
    const byStage = await prisma.staybackRequest.groupBy({
      by: ["stage"],
      _count: true,
    })

    // Requests by club (for bar chart)
    const byClub = await prisma.staybackRequest.groupBy({
      by: ["clubName"],
      _count: true,
    })

    // Daily trend for the configured number of days (for area chart)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0)

    const recentRequests = await prisma.staybackRequest.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    })

    // Group by day
    const dailyCounts: Record<string, number> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      const key = d.toISOString().split("T")[0]
      dailyCounts[key] = 0
    }
    recentRequests.forEach((r) => {
      const key = r.createdAt.toISOString().split("T")[0]
      if (dailyCounts[key] !== undefined) dailyCounts[key]++
    })

    // Security check stats (for donut chart)
    const securityStats = await prisma.staybackRequest.groupBy({
      by: ["securityStatus"],
      _count: true,
      where: { stage: { in: ["WARDEN_PENDING", "COMPLETED"] } },
    })

    const totalCompleted = securityStats.reduce((acc, s) => acc + s._count, 0)
    const checkedIn = securityStats.find((s) => s.securityStatus === "IN")?._count || 0
    const checkedOut = securityStats.find((s) => s.securityStatus === "OUT")?._count || 0
    const unchecked = totalCompleted - checkedIn - checkedOut

    // Format dates appropriately based on range
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr)
      if (days <= 14) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    return NextResponse.json({
      byStage: byStage.map((s) => ({ name: s.stage.replace(/_/g, " "), value: s._count })),
      byClub: byClub.map((c) => ({ name: c.clubName, value: c._count })),
      dailyTrend: Object.entries(dailyCounts).map(([date, count]) => ({
        date: formatDate(date),
        fullDate: date,
        count,
      })),
      security: {
        checkedIn,
        checkedOut,
        unchecked,
      },
      totalInRange: recentRequests.length,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
