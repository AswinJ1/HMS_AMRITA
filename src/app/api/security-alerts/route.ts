import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !["STAFF", "HOSTEL", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get stayback requests with security tracking (fields are on the request itself)
    const requests = await prisma.staybackRequest.findMany({
      where: {
        securityStatus: { in: ["IN", "OUT"] }
      },
      include: {
        student: {
          include: {
            user: {
              select: { email: true, uid: true }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 10 // Latest 10 security updates
    })
    
    const formattedRequests = requests.map(request => ({
      id: request.id,
      student: request.student,
      clubName: request.clubName,
      date: request.date,
      fromTime: request.fromTime,
      toTime: request.toTime,
      securityStatus: request.securityStatus || "PENDING",
      securityCheckedBy: request.securityCheckedBy,
      securityApprovedAt: request.securityCheckedAt
    }))
    
    return NextResponse.json({ requests: formattedRequests })
  } catch (error) {
    console.error("Error fetching security alerts:", error)
    return NextResponse.json({ error: "Failed to fetch security alerts" }, { status: 500 })
  }
}
