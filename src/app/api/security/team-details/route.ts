// app/api/security/team-details/route.ts - Team details for security personnel

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || session.user.role !== "SECURITY")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const club = searchParams.get("club")
        const search = searchParams.get("search")

        // Fetch students
        const studentWhere: any = {}
        if (club && club !== "ALL") studentWhere.clubName = club
        if (search) studentWhere.name = { contains: search, mode: "insensitive" }

        const students = await prisma.student.findMany({
            where: studentWhere,
            include: { user: { select: { email: true, uid: true } } },
            orderBy: { name: "asc" },
        })

        // Fetch team leads
        const tlWhere: any = {}
        if (club && club !== "ALL") tlWhere.clubName = club
        if (search) tlWhere.name = { contains: search, mode: "insensitive" }

        const teamLeads = await prisma.teamLead.findMany({
            where: tlWhere,
            include: { user: { select: { email: true, uid: true } } },
            orderBy: { name: "asc" },
        })

        const members = [
            ...teamLeads.map((tl) => ({
                id: tl.id,
                name: tl.name,
                type: "Team Lead" as const,
                clubName: tl.clubName,
                hostelName: "",
                roomNo: "",
                phoneNumber: "",
                email: tl.user.email,
                uid: tl.user.uid || "",
                gender: tl.gender,
            })),
            ...students
                .filter((s) => !s.isTeamLead) // exclude students who are also team leads
                .map((s) => ({
                    id: s.id,
                    name: s.name,
                    type: "Student" as const,
                    clubName: s.clubName,
                    hostelName: s.hostelName,
                    roomNo: s.roomNo,
                    phoneNumber: s.phoneNumber,
                    email: s.user.email,
                    uid: s.user.uid || "",
                    gender: s.gender,
                })),
        ]

        return NextResponse.json({ members })
    } catch (error) {
        console.error("Error fetching team details:", error)
        return NextResponse.json({ error: "Failed to fetch team details" }, { status: 500 })
    }
}
