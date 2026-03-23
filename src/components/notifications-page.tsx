"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, Clock, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Notification {
  id: string
  title: string
  message: string
  type: "approval" | "rejection" | "info" | "pending"
  time: string
  read: boolean
}

const typeConfig = {
  approval: {
    icon: CheckCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  rejection: {
    icon: X,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
  },
  info: {
    icon: AlertCircle,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  pending: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST" })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // Silently fail
    }
  }

  const markOneRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage your stayback request alerts and updates.</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="outline" size="sm">
            <Check className="mr-2 size-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            You have {unreadCount} unread message{unreadCount !== 1 && "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 border rounded-md p-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted w-[200px]"></div>
                    <div className="h-3 bg-muted w-full"></div>
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md border-dashed">
                <Bell className="mb-4 size-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No notifications found
                </p>
                <p className="text-sm text-muted-foreground/60">
                  You are all caught up on your alerts.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig[notification.type]
                const Icon = config.icon
                return (
                  <button
                    key={notification.id}
                    onClick={() => markOneRead(notification.id)}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 text-left ${
                      !notification.read ? "bg-muted/30 border-primary/20 shadow-sm" : "bg-card"
                    }`}
                  >
                    <div
                      className={`mt-1 flex size-10 shrink-0 items-center justify-center `}
                    >
                      <Icon className={`size-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {notification.time}
                        </p>
                      </div>
                      <p className={`text-sm ${!notification.read ? "text-muted-foreground" : "text-muted-foreground/80"}`}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="flex size-2 mt-4 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
