import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Optional: Filter by student's hostel if needed
    let whereClause = {}
    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { hostelName: true }
      })
      
      // You can choose to show only their hostel or all hostels
      // whereClause = student ? { hostelName: student.hostelName } : {}
    }
    
    const hostels = await prisma.hostel.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            uid: true,
          }
        }
      },
      orderBy: {
        hostelName: 'asc'
      }
    })
    
    const formattedHostels = hostels.map(hostel => ({
      id: hostel.id,
      name: hostel.name,
      hostelName: hostel.hostelName,
      email: hostel.user.email,
    }))
    
    return NextResponse.json(formattedHostels)
  } catch (error) {
    console.error("Error fetching hostel list:", error)
    return NextResponse.json(
      { error: "Failed to fetch hostel list" },
      { status: 500 }
    )
  }
}