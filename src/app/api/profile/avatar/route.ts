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
      include: { student: true },
    })

    if (!user?.student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const updatedStudent = await prisma.student.update({
      where: {
        userId: user.id,
      },
      data: {
        avatarUrl,
        ...(gender && { gender }),
      },
    })

    return NextResponse.json({ success: true, avatarUrl: updatedStudent.avatarUrl, gender: updatedStudent.gender })
  } catch (error) {
    console.error("Error updating avatar:", error)
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    )
  }
}