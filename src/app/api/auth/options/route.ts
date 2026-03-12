import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Public endpoint: returns available clubs and hostels for registration dropdown
export async function GET() {
  try {
    const [teamLeads, hostels] = await Promise.all([
      prisma.teamLead.findMany({
        select: { clubName: true },
        orderBy: { clubName: "asc" },
      }),
      prisma.hostel.findMany({
        select: { hostelName: true },
        distinct: ["hostelName"],
        orderBy: { hostelName: "asc" },
      }),
    ])

    const clubs = [...new Set(teamLeads.map((tl) => tl.clubName))].sort()
    const hostelNames = hostels.map((h) => h.hostelName)

    return NextResponse.json({ clubs, hostels: hostelNames })
  } catch (error) {
    console.error("Error fetching registration options:", error)
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 }
    )
  }
}
