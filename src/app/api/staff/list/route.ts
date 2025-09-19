
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const staffMembers = await prisma.staff.findMany({
      include: {
        user: {
          select: {
            email: true,
            uid: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    const formattedStaff = staffMembers.map(staff => ({
      id: staff.id,
      name: staff.name,
      department: staff.department,
      email: staff.user.email,
    }))
    
    return NextResponse.json(formattedStaff)
  } catch (error) {
    console.error("Error fetching staff list:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff list" },
      { status: 500 }
    )
  }
}