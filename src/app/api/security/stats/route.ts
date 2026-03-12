// app/api/security/stats/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    const [totalActive, markedIn, markedOut, todayChecks] = await Promise.all([
      prisma.staybackRequest.count({
        where: { stage: { in: ["WARDEN_PENDING", "COMPLETED"] } },
      }),
      prisma.staybackRequest.count({
        where: { securityStatus: "IN", stage: { in: ["WARDEN_PENDING", "COMPLETED"] } },
      }),
      prisma.staybackRequest.count({
        where: { securityStatus: "OUT", stage: { in: ["WARDEN_PENDING", "COMPLETED"] } },
      }),
      prisma.staybackRequest.count({
        where: {
          securityCheckedAt: { gte: todayStart, lt: todayEnd },
        },
      }),
    ])

    return NextResponse.json({
      totalActive,
      markedIn,
      markedOut,
      todayChecks,
      securityName: security.name,
      department: security.department || "Campus Security",
    })
  } catch (error) {
    console.error("Error fetching security stats:", error)
    return NextResponse.json({ error: "Failed to fetch security statistics" }, { status: 500 })
  }
}
