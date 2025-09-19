import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const teamLeads = await prisma.teamLead.findMany({
      include: {
        user: {
          select: {
            email: true,
            uid: true,
          }
        }
      },
      orderBy: {
        clubName: 'asc'
      }
    })
    
    const formattedTeamLeads = teamLeads.map(teamLead => ({
      id: teamLead.id,
      name: teamLead.name,
      clubName: teamLead.clubName,
      department: teamLead.department,
      email: teamLead.user.email,
    }))
    
    return NextResponse.json(formattedTeamLeads)
  } catch (error) {
    console.error("Error fetching team lead list:", error)
    return NextResponse.json(
      { error: "Failed to fetch team lead list" },
      { status: 500 }
    )
  }
}