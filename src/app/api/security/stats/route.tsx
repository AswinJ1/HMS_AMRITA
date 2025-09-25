// app/api/security/stats/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "SECURITY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get security user profile
    const security = await prisma.security.findUnique({
      where: { userId: session.user.id },
    })
    
    if (!security) {
      return NextResponse.json({ error: "Security user not found" }, { status: 404 })
    }
    
    // Get all security tracking records for this security user
    const securityApprovals = await prisma.staybackApproval.findMany({
      where: {
        comments: {
          startsWith: `SECURITY_TRACKING:${security.id}:`
        }
      },
      include: {
        request: true
      }
    })
    
    // Calculate today's date for filtering
    const today = new Date()
    const todayStart = new Date(today.setHours(0, 0, 0, 0))
    const todayEnd = new Date(today.setHours(23, 59, 59, 999))
    
    // Calculate statistics
    const totalRequests = securityApprovals.length
    const activeRequests = securityApprovals.filter(a => a.status === "PENDING").length
    const completedToday = securityApprovals.filter(a => 
      a.approvedAt && 
      a.approvedAt >= todayStart && 
      a.approvedAt <= todayEnd
    ).length
    const securityChecks = securityApprovals.filter(a => 
      a.status === "APPROVED" || a.status === "REJECTED"
    ).length
    
    return NextResponse.json({
      totalRequests,
      activeRequests,
      completedToday,
      securityChecks,
      securityName: security.name,
      department: security.department || "Campus Security"
    })
  } catch (error) {
    console.error("Error fetching security stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch security statistics" },
      { status: 500 }
    )
  }
}