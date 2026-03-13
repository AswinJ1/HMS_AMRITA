// app/api/export/stayback/route.ts - Admin CSV export for stayback data

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || session.user.role !== "ADMIN")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const club = searchParams.get("club")
        const stage = searchParams.get("stage")
        const status = searchParams.get("status")
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        const where: any = {}
        if (club && club !== "ALL") where.clubName = club
        if (stage && stage !== "ALL") where.stage = stage
        if (status && status !== "ALL") where.status = status
        if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = new Date(startDate)
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                where.date.lte = end
            }
        }

        const requests = await prisma.staybackRequest.findMany({
            where,
            include: {
                student: true,
                teamLeadApplicant: true,
            },
            orderBy: { createdAt: "desc" },
        })

        // Build CSV
        const headers = [
            "Applicant Name",
            "Type",
            "Club",
            "Hostel",
            "Room",
            "Phone",
            "Date",
            "From Time",
            "To Time",
            "Remarks",
            "Stage",
            "Status",
            "Security Status",
            "Security Checked At",
            "Checked By",
            "Created At",
        ]

        const escapeCSV = (val: string) => {
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                return `"${val.replace(/"/g, '""')}"`
            }
            return val
        }

        const rows = requests.map((req) => {
            const isStudent = !!req.studentId
            const name = req.student?.name || req.teamLeadApplicant?.name || "Unknown"
            const type = isStudent ? "Student" : "Team Lead"
            const hostel = req.student?.hostelName || ""
            const room = req.student?.roomNo || ""
            const phone = req.student?.phoneNumber || ""
            const dateStr = format(new Date(req.date), "yyyy-MM-dd")
            const secAt = req.securityCheckedAt
                ? format(new Date(req.securityCheckedAt), "yyyy-MM-dd HH:mm:ss")
                : ""

            return [
                name,
                type,
                req.clubName,
                hostel,
                room,
                phone,
                dateStr,
                req.fromTime,
                req.toTime,
                req.remarks,
                req.stage,
                req.status,
                req.securityStatus || "",
                secAt,
                req.securityCheckedBy || "",
                format(new Date(req.createdAt), "yyyy-MM-dd HH:mm:ss"),
            ]
                .map((v) => escapeCSV(String(v)))
                .join(",")
        })

        const csv = [headers.join(","), ...rows].join("\n")

        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="stayback_export_${format(new Date(), "yyyy-MM-dd")}.csv"`,
            },
        })
    } catch (error) {
        console.error("Error exporting stayback data:", error)
        return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
    }
}
