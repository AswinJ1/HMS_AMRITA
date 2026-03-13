"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Shield,
  Users,
  Activity,
  Menu,
  LogOut,
  ChevronLeft,
  Building2,
  Send,
  History,
  UserCircle,
  Sun,
  Moon,
  UserCog,
  Settings,
  KeyRound,
} from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const roleBasePath: Record<string, string> = {
  STUDENT: "/student",
  TEAM_LEAD: "/team-lead",
  STAFF: "/staff",
  HOSTEL: "/hostel",
  SECURITY: "/security",
  ADMIN: "/admin",
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/student", icon: <LayoutDashboard className="size-4" />, roles: ["STUDENT"] },
  { title: "Apply Stayback", href: "/student/stayback", icon: <Send className="size-4" />, roles: ["STUDENT"] },
  { title: "My Requests", href: "/student/requests", icon: <FileText className="size-4" />, roles: ["STUDENT"] },

  { title: "Dashboard", href: "/team-lead", icon: <LayoutDashboard className="size-4" />, roles: ["TEAM_LEAD"] },
  { title: "Approvals", href: "/team-lead/approvals", icon: <ClipboardCheck className="size-4" />, roles: ["TEAM_LEAD"] },
  { title: "Apply Stayback", href: "/team-lead/stayback", icon: <Send className="size-4" />, roles: ["TEAM_LEAD"] },
  { title: "My Requests", href: "/team-lead/requests", icon: <History className="size-4" />, roles: ["TEAM_LEAD"] },

  { title: "Dashboard", href: "/staff", icon: <LayoutDashboard className="size-4" />, roles: ["STAFF"] },
  { title: "Approvals", href: "/staff/approvals", icon: <ClipboardCheck className="size-4" />, roles: ["STAFF"] },
  { title: "Team Leads", href: "/staff/team-leads", icon: <UserCog className="size-4" />, roles: ["STAFF"] },

  { title: "Dashboard", href: "/hostel", icon: <LayoutDashboard className="size-4" />, roles: ["HOSTEL"] },
  { title: "Approvals", href: "/hostel/approvals", icon: <ClipboardCheck className="size-4" />, roles: ["HOSTEL"] },

  { title: "Dashboard", href: "/security", icon: <LayoutDashboard className="size-4" />, roles: ["SECURITY"] },
  { title: "Monitoring", href: "/security/monitoring", icon: <Shield className="size-4" />, roles: ["SECURITY"] },
  { title: "Team Details", href: "/security/team-details", icon: <Users className="size-4" />, roles: ["SECURITY"] },

  { title: "Dashboard", href: "/admin", icon: <LayoutDashboard className="size-4" />, roles: ["ADMIN"] },
  { title: "Users", href: "/admin/users", icon: <Users className="size-4" />, roles: ["ADMIN"] },
  { title: "Settings", href: "/admin/settings", icon: <Settings className="size-4" />, roles: ["ADMIN"] },
  { title: "Logs", href: "/admin/logs", icon: <Activity className="size-4" />, roles: ["ADMIN"] },
]

function SidebarContent({ collapsed, role, pathname, profileHref }: { collapsed: boolean; role: string; pathname: string; profileHref: string }) {
  const items = navItems.filter((item) => item.roles.includes(role))

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Image src="/logo.png" alt="HMS Logo" width={32} height={32} className="shrink-0 rounded" />
          {!collapsed && (
            <span className="ml-3 text-sm font-semibold tracking-tight text-sidebar-foreground">
              HMS Amrita
            </span>
          )}
        </div>

        {/* Main Nav */}
        <ScrollArea className="flex-1 py-3">
          <div className="px-3">
            {!collapsed && (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                Navigation
              </p>
            )}
            <nav className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = pathname === item.href
                const link = (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`group flex items-center gap-3 px-2.5 py-2 text-[13px] font-medium transition-all ${active
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80"
                        } ${collapsed ? "justify-center px-2" : ""}`}
                    >
                      <span className={active ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60"}>{item.icon}</span>
                      {!collapsed && <span>{item.title}</span>}
                    </div>
                  </Link>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{item.title}</TooltipContent>
                    </Tooltip>
                  )
                }
                return link
              })}
            </nav>
          </div>

          {/* Profile & Logout section */}
          <div className="mt-4 px-3">
            <Separator className="mb-3 bg-sidebar-border" />
            {!collapsed && (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                Account
              </p>
            )}
            <nav className="flex flex-col gap-0.5">
              {[
                { title: "Profile", href: profileHref, icon: <UserCircle className="size-4" /> },
              ].map((item) => {
                const active = pathname === item.href
                const link = (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`group flex items-center gap-3 px-2.5 py-2 text-[13px] font-medium transition-all ${active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80"
                        } ${collapsed ? "justify-center px-2" : ""}`}
                    >
                      <span className={active ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60"}>{item.icon}</span>
                      {!collapsed && <span>{item.title}</span>}
                    </div>
                  </Link>
                )
                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{item.title}</TooltipContent>
                    </Tooltip>
                  )
                }
                return link
              })}

              {/* Logout */}
              {(() => {
                const btn = (
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className={`group flex w-full items-center gap-3 px-2.5 py-2 text-[13px] font-medium text-destructive/70 transition-all hover:bg-destructive/10 hover:text-destructive ${collapsed ? "justify-center px-2" : ""
                      }`}
                  >
                    <LogOut className="size-4" />
                    {!collapsed && <span>Sign out</span>}
                  </button>
                )
                if (collapsed) {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>{btn}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">Sign out</TooltipContent>
                    </Tooltip>
                  )
                }
                return btn
              })()}
            </nav>
          </div>
        </ScrollArea>

        {/* Collapse toggle */}
        <div className="hidden lg:block border-t border-sidebar-border p-2">
          <button className="hidden" />
        </div>
      </div>
    </TooltipProvider>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const role = session?.user?.role || "STUDENT"
  const initials = (session?.user?.name || "U").slice(0, 2).toUpperCase()
  const profileHref = `${roleBasePath[role] || "/student"}/profile`
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ${collapsed ? "w-[60px]" : "w-[240px]"
          }`}
      >
        <SidebarContent collapsed={collapsed} role={role} pathname={pathname} profileHref={profileHref} />

        {/* Collapse button */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center py-1.5 text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors"
          >
            <ChevronLeft className={`size-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0 bg-sidebar border-sidebar-border">
                <SidebarContent collapsed={false} role={role} pathname={pathname} profileHref={profileHref} />
              </SheetContent>
            </Sheet>

            <div className="hidden sm:flex items-center gap-2.5">
              <Image src="/logo.png" alt="HMS Logo" width={30} height={30} className="rounded" />
              <h1 className="text-base font-bold tracking-tight text-foreground">
                Hostel Management System
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden md:inline-flex h-6 text-[10px] font-semibold uppercase tracking-wider">
              {role.replace("_", " ")}
            </Badge>

            <Separator orientation="vertical" className="hidden md:block mx-1 h-5" />

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notification Bell */}
            <NotificationBell role={role} />

            <Separator orientation="vertical" className="hidden md:block mx-1 h-5" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2.5 px-2 hover:bg-muted">
                  <Avatar className="size-7">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold leading-none">{session?.user?.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground leading-none">{session?.user?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal py-2">
                  <p className="text-sm font-semibold">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={profileHref} className="cursor-pointer">
                    <UserCircle className="mr-2 size-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
