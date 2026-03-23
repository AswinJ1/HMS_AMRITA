import { prisma } from "@/lib/prisma"

/**
 * Create a notification for a user.
 * Call this from approval/rejection/security flows.
 */
export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  sourceId,
}: {
  userId: string
  title: string
  message: string
  type?: "approval" | "rejection" | "info" | "pending"
  sourceId?: string
}) {
  try {
    // @ts-ignore: Prisma client type might not be updated in IDE yet
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        sourceId,
      },
    })
  } catch (error) {
    console.error("Failed to create notification:", error)
    // Non-critical — don't throw
  }
}
