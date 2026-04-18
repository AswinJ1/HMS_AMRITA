import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/users/edit — Admin edits any user's profile fields
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, email, uid, name, department, hostelName, clubName, roomNo, phoneNumber } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true, staff: true, hostel: true, teamLead: true, admin: true, security: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update base user fields
    const userUpdate: Record<string, unknown> = {}
    if (email && email !== user.email) userUpdate.email = email
    if (uid !== undefined && uid !== user.uid) userUpdate.uid = uid || null

    if (Object.keys(userUpdate).length > 0) {
      // Check uniqueness
      if (userUpdate.email) {
        const exists = await prisma.user.findFirst({ where: { email: userUpdate.email as string, NOT: { id: userId } } })
        if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
      if (userUpdate.uid) {
        const exists = await prisma.user.findFirst({ where: { uid: userUpdate.uid as string, NOT: { id: userId } } })
        if (exists) return NextResponse.json({ error: "UID already in use" }, { status: 400 })
      }
      await prisma.user.update({ where: { id: userId }, data: userUpdate })
    }

    // Update role-specific profile
    switch (user.role) {
      case "STUDENT":
        if (user.student) {
          await prisma.student.update({
            where: { userId },
            data: {
              ...(name && { name }),
              ...(clubName && { clubName }),
              ...(hostelName && { hostelName }),
              ...(roomNo && { roomNo }),
              ...(phoneNumber && { phoneNumber }),
            },
          })
        }
        break
      case "STAFF":
        if (user.staff) {
          await prisma.staff.update({
            where: { userId },
            data: {
              ...(name && { name }),
              ...(department !== undefined && { department }),
            },
          })
        }
        break
      case "HOSTEL":
        if (user.hostel) {
          await prisma.hostel.update({
            where: { userId },
            data: {
              ...(name && { name }),
              ...(hostelName && { hostelName }),
            },
          })
        }
        break
      case "TEAM_LEAD":
        if (user.teamLead) {
          await prisma.teamLead.update({
            where: { userId },
            data: {
              ...(name && { name }),
              ...(clubName && { clubName }),
              ...(department !== undefined && { department }),
            },
          })
        }
        break
      case "SECURITY":
        if (user.security) {
          if (name && name !== user.security.name) {
            await prisma.staybackRequest.updateMany({
              where: { securityCheckedBy: user.security.name },
              data: { securityCheckedBy: name }
            })
          }
          await prisma.security.update({
            where: { userId },
            data: {
              ...(name && { name }),
              ...(department !== undefined && { department }),
            },
          })
        }
        break
      case "ADMIN":
        if (user.admin) {
          await prisma.admin.update({
            where: { userId },
            data: { ...(name && { name }) },
          })
        }
        break
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Error editing user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
