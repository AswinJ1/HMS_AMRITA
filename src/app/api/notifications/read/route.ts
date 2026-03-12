import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // For now, mark-read is handled client-side. 
    // This endpoint acknowledges the request.
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
