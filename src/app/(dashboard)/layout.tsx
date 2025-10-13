"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckCircle, 
  UserCheck,
  Plus,
  LogOut,
  Menu,
  X,
  ChevronRight,
  EyeIcon,
  Edit,
  User2Icon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavigationItem {
  name: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["ADMIN"]
  },
  {
    name: "Dashboard",
    href: "/hostel",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["HOSTEL"]
  },
  {
    name: "Dashboard",
    href: "/staff",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["STAFF"]
  },
  {
    name: "Dashboard",
    href: "/team-lead",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["TEAM_LEAD"]
  },
  {
    name: "Dashboard",
    href: "/student",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["STUDENT"]
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
    roles: ["ADMIN"]
  },
  {
    name: "System Logs",
    href: "/admin/logs",
    icon: <FileText className="w-5 h-5" />,
    roles: ["ADMIN"]
  },
  {
    name: "Approvals",
    href: "/hostel/approvals",
    icon: <CheckCircle className="w-5 h-5" />,
    roles: ["HOSTEL"]
  },
  {
    name: "Approvals",
    href: "/staff/approvals",
    icon: <CheckCircle className="w-5 h-5" />,
    roles: ["STAFF"]
  },

  {
    name: "Home",
    href: "/security",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["SECURITY"]

  },
  {
    name: "Monitor",
    href: "/security/monitoring",
    icon: <EyeIcon className="w-5 h-5" />,
    roles: ["SECURITY"]
  },
  {
    name: "Edit Profile",
    href: "/security/edit_profile",
    icon: <Edit className="w-5 h-5" />,
    roles: ["SECURITY"]
  },
   {
    name: " Profile",
    href: "/security/profile",
    icon: <User2Icon className="w-5 h-5" />,
    roles: ["SECURITY"]
  },
  {
    name: "Team Leads",
    href: "/staff/team-leads",
    icon: <UserCheck className="w-5 h-5" />,
    roles: ["STAFF"]
  },
  {
    name: "Approvals",
    href: "/team-lead/approvals",
    icon: <CheckCircle className="w-5 h-5" />,
    roles: ["TEAM_LEAD"]
  },
  {
    name: "My Requests",
    href: "/student/requests",
    icon: <FileText className="w-5 h-5" />,
    roles: ["STUDENT"]
  },
  {
    name: "New Request",
    href: "/student/stayback",
    icon: <Plus className="w-5 h-5" />,
    roles: ["STUDENT"]
  },
   {
    name: "Profile",
    href: "/student/profile",
    icon: <User2Icon className="w-5 h-5" />,
    roles: ["STUDENT"]
  }
]

const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (role) {
    case "ADMIN":
      return "destructive"
    case "HOSTEL":
    case "STAFF":  
    case "TEAM_LEAD":
    case "SECURITY":
      return "secondary"
    case "STUDENT":
      return "default"
    default:
      return "outline"
  }
}

function NavItem({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: NavigationItem
  isActive: boolean
  onClick?: () => void 
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-primary"
      )}
    >
      {item.icon}
      <span>{item.name}</span>
      {isActive && (
        <ChevronRight className="ml-auto h-4 w-4" />
      )}
    </Link>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const userRole = session.user.role
  const userEmail = session.user.email || ""
  const userInitial = userEmail.charAt(0).toUpperCase()
  
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  )

  const isCurrentPath = (href: string) => {
    const roleBase = `/${userRole.toLowerCase().replace('_', '-')}`
    if (href === roleBase) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center gap-2 px-6 lg:h-[60px]">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold">HM</span>
        </div>
        <span className="font-semibold">Hostel Management</span>
      </div>
      
      <Separator />
      
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-4">
          {filteredNavigation.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={isCurrentPath(item.href)}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>
      </ScrollArea>
      
      <Separator />
      
      {/* <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar>
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none truncate">{userEmail}</p>
            <Badge variant={getRoleVariant(userRole)} className="text-xs">
              {userRole.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div> */}
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-xs font-bold">HM</span>
              </div>
              <span className="font-semibold">Hostel Management</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userEmail}</p>
                    <Badge variant={getRoleVariant(userRole)} className="text-xs mt-1">
                      {userRole.replace('_', ' ')}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}