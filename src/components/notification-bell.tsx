"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, Clock, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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

export function NotificationBell({ role }: { role: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      // Only fetch unread notifications for the bell
      const response = await fetch("/api/notifications?filter=unread", {
        headers: { "Cache-Control": "no-cache" },
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.length // All fetched are unread

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST" })
      setNotifications([]) // Clear all since they're now read
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
      // Remove the notification from the list since it's now read
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      // Silently fail
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllRead}
            >
              <Check className="mr-1 size-3" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-2 size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                No notifications
              </p>
              <p className="text-xs text-muted-foreground/60">
                You&apos;re all caught up
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type]
                const Icon = config.icon
                return (
                  <button
                    key={notification.id}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 bg-muted/30"
                    onClick={() => markOneRead(notification.id)}
                  >
                    <div
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center ${config.bg}`}
                    >
                      <Icon className={`size-3.5 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-semibold">
                          {notification.title}
                        </p>
                        <span className="size-1.5 shrink-0 bg-primary" />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        {notification.time}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="bg-popover relative z-10">
            <Separator />
            <div className="p-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setOpen(false)
                  window.location.href = `/${role.toLowerCase().replace("_", "-")}/notification`
                }}
              >
                View all notifications
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
