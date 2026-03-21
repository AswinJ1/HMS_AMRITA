// src/app/api/export/stayback/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import ExcelJS from "exceljs"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

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

        // 1. Fetch data from Prisma, including all approvals
        const requests = await prisma.staybackRequest.findMany({
            where,
            include: {
                student: { include: { user: true } },
                teamLeadApplicant: { include: { user: true } },
                approvals: {   
                    include: {
                        teamLead: true,
                        staff: true,
                        hostel: true
                    }
                }
            },
            orderBy: { date: "asc" }, // Order chronologically 
        })

        // 2. Group the requests by Month and Year
        const groupedRequests: Record<string, typeof requests> = {}
        
        requests.forEach((req) => {
            const monthYear = format(new Date(req.date), "MMMM yyyy")
            if (!groupedRequests[monthYear]) {
                groupedRequests[monthYear] = []
            }
            groupedRequests[monthYear].push(req)
        })

        const workbook = new ExcelJS.Workbook()

        if (Object.keys(groupedRequests).length === 0) {
            const emptySheet = workbook.addWorksheet("No Data")
            emptySheet.addRow(["No records found for the selected filters."])
        }

        // 3. Create a worksheet per month
        for (const [month, monthRequests] of Object.entries(groupedRequests)) {
            const worksheet = workbook.addWorksheet(month)

            // Define the expanded columns
            worksheet.columns = [
                { header: "Name", key: "name", width: 25 },
                { header: "Role type", key: "roleType", width: 15 }, // Shows Student vs Team Lead
                { header: "Hostel", key: "hostel", width: 15 },
                { header: "Date", key: "date", width: 15 },
                { header: "Club", key: "club", width: 20 },
                { header: "Email", key: "email", width: 30 },
                { header: "TL Name", key: "tlName", width: 25 },
                { header: "TL Status", key: "tlStatus", width: 20 },
                { header: "Faculty Name", key: "faculty", width: 25 },
                { header: "Staff Status", key: "staffStatus", width: 15 },
                {header: "Warden Name", key: "warden", width: 25 },
                { header: "Warden Status", key: "wardenStatus", width: 15 },
                { header: "Overall Status", key: "overallStatus", width: 15 },
                { header: "Security Gate Status", key: "securityStatus", width: 20 },
                { header: "Security Timestamp", key: "securityTime", width: 25 },
                { header: "Reason", key: "reason", width: 40 }
            ]

            const headerRow = worksheet.getRow(1)
            headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } } 
            headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } }
            
            headerRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'medium' }, right: { style: 'thin' }
                }
            })

            // Add Data Rows for this month
            monthRequests.forEach((req) => {
                // Determine whether it's a student or team lead applying
                const isStudent = !!req.studentId;
                const roleType = isStudent ? "Student" : "Team Lead";
                
                const name = req.student?.name || req.teamLeadApplicant?.name || "Unknown";
                const hostel = req.student?.hostelName || "N/A";
                const email = req.student?.user?.email || req.teamLeadApplicant?.user?.email || "N/A";
                const dateStr = format(new Date(req.date), "dd-MMM-yyyy");
                
                // Find specific approvers
                const tlApproval = req.approvals?.find((a: any) => a.teamLead !== null);
                const staffApproval = req.approvals?.find((a: any) => a.staff !== null);
                const wardenApproval = req.approvals?.find((a: any) => a.hostel !== null);

                // Format Team Lead Logic based on applicant role
                let finalTlName = "N/A";
                let finalTlStatus = "PENDING";

                if (!isStudent) {
                    finalTlName = name; // Self
                    finalTlStatus = "N/A - Self (Team Lead)";
                } else {
                    finalTlName = tlApproval?.teamLead?.name || "Pending / Not Assigned";
                    finalTlStatus = tlApproval?.status || "PENDING";
                }
                
                // Format Security Timestamp
                const securityTimeFormat = req.securityCheckedAt 
                    ? format(new Date(req.securityCheckedAt), "dd-MMM-yyyy HH:mm:ss")
                    : "Not Checked";

                worksheet.addRow({
                    name: name,
                    roleType: roleType,
                    hostel: hostel,
                    date: dateStr,
                    club: req.clubName,
                    email: email,
                    // Team Lead Dynamic Info
                    tlName: finalTlName,
                    tlStatus: finalTlStatus,
                    // Faculty & Warden Info
                    faculty: staffApproval?.staff?.name || "Pending / Not Assigned",
                    warden: wardenApproval?.hostel?.name || "Pending / Not Assigned",
                    staffStatus: staffApproval?.status || "PENDING",
                    wardenStatus: wardenApproval?.status || "PENDING",
                    overallStatus: req.status,
                    // Security Tracking
                    securityStatus: req.securityStatus || "WAITING",
                    securityTime: securityTimeFormat,
                    reason: req.remarks || "—",
                })
            })

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) { 
                    row.fill = {
                        type: "pattern", pattern: "solid",
                        fgColor: { argb: rowNumber % 2 === 0 ? "FFF2F2F2" : "FFFFFFFF" } 
                    }
                }
            })
        }

        const buffer = await workbook.xlsx.writeBuffer()

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="Stayback_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
            },
        })

    } catch (error) {
        console.error("Error exporting stayback data:", error)
        return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
    }
}
