import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all" // "all" | "unread" | "read"

    const whereClause: any = { userId: session.user.id }
    if (filter === "unread") {
      whereClause.read = false
    } else if (filter === "read") {
      whereClause.read = true
    }

    // @ts-ignore
    if (!prisma.notification) {
      console.error("FATAL: prisma.notification is undefined in Next.js runtime. Needs server restart.")
      return NextResponse.json({ error: "Database client is outdated. Please restart your Next.js server (npm run dev)." }, { status: 500 })
    }

    // @ts-ignore: Prisma client type might not be updated in TS server yet
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const mappedNotifications = notifications.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      time: formatTimeAgo(n.createdAt),
      read: n.read,
    }))

    return NextResponse.json(mappedNotifications)
  } catch (error: any) {
    console.error("Notifications error:", error)
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
