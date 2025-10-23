
// app/api/logs/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const clubName = searchParams.get("clubName")
    const hostelName = searchParams.get("hostelName")
    
    // Build filter query
    const where: any = {}
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    
    if (status) {
      where.status = status
    }
    
    if (clubName) {
      where.clubName = clubName
    }
    
    if (hostelName) {
      where.student = {
        hostelName: hostelName,
      }
    }
    
    const requests = await prisma.staybackRequest.findMany({
      where,
      include: {
        student: true,
        approvals: {
          include: {
            staff: true,
            hostel: true,
            teamLead: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    
    // Get statistics
    const stats = await prisma.staybackRequest.groupBy({
      by: ["status"],
      _count: true,
      where,
    })
    
    return NextResponse.json({
      requests,
      stats: stats.reduce((acc, curr) => {
        acc[curr.status] = curr._count
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    )
  }
}