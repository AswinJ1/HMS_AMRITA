import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CLUBS } from "@/lib/clubs"

// Public endpoint: returns available clubs and hostels for registration dropdown
export async function GET() {
  // Clubs: always available from static config
  const clubs = [...CLUBS]

  // Hostels: from warden records created by admin
  let hostelNames: string[] = []
  try {
    const hostels = await prisma.hostel.findMany({
      select: { hostelName: true },
      distinct: ["hostelName"],
      orderBy: { hostelName: "asc" },
    })
    hostelNames = hostels.map((h) => h.hostelName)
  } catch (error) {
    console.error("Error fetching hostels:", error)
  }

  return NextResponse.json({ clubs, hostels: hostelNames })
}
