import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { avatarUrl, gender } = await request.json()

    if (!avatarUrl) {
      return NextResponse.json({ error: "Avatar URL is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        student: true,
        staff: true,
        hostel: true,
        teamLead: true,
        security: true,
        admin: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let updatedProfile: any = null

    // Update based on user role
    if (user.student) {
      updatedProfile = await prisma.student.update({
        where: { userId: user.id },
        data: {
          avatarUrl,
          ...(gender && { gender }),
        },
      })
    } else if (user.staff) {
      updatedProfile = await prisma.staff.update({
        where: { userId: user.id },
        data: {
          avatarUrl,
          ...(gender && { gender }),
        },
      })
    } else if (user.hostel) {
      updatedProfile = await prisma.hostel.update({
        where: { userId: user.id },
        data: {
          avatarUrl,
          ...(gender && { gender }),
        },
      })
    } else if (user.teamLead) {
      updatedProfile = await prisma.teamLead.update({
        where: { userId: user.id },
        data: {
          avatarUrl,
          ...(gender && { gender }),
        },
      })
    } else if (user.security) {
      updatedProfile = await prisma.security.update({
        where: { userId: user.id },
        data: {
          avatarUrl,
          ...(gender && { gender }),
        },
      })
    } else if (user.admin) {
      updatedProfile = await prisma.admin.update({
        where: { userId: user.id },
        data: {
          avatarUrl,
          ...(gender && { gender }),
        },
      })
    } else {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      avatarUrl: updatedProfile?.avatarUrl || avatarUrl, 
      gender: updatedProfile?.gender || gender 
    })
  } catch (error) {
    console.error("Error updating avatar:", error)
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    )
  }
}