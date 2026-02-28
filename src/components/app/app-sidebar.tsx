"use client"

import {
  ClapperboardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  UsersIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/avatar"
import { Button } from "@/components/common/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/common/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"
import { authClient } from "@/lib/auth/auth-client"

const navItems = [
  { label: "Home", href: "/home", icon: LayoutDashboardIcon },
  { label: "Productions", href: "/productions", icon: ClapperboardIcon },
  { label: "Performers", href: "/performers", icon: UsersIcon },
]

interface Props {
  user: { name: string; email: string; image?: string | null }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AppSidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleSidebar } = useSidebar()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  async function handleLogOut() {
    await authClient.signOut()
    router.push("/auth")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          {/* Expanded: logo + collapse button */}
          <SidebarMenuItem className="flex items-center group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton size="lg" asChild className="flex-1">
              <Link href="/home">
                <Image
                  src="/logo.svg"
                  alt="Castparty"
                  width={140}
                  height={26}
                />
              </Link>
            </SidebarMenuButton>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="size-7"
                >
                  <PanelLeftCloseIcon />
                  <span className="sr-only">Collapse sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Collapse sidebar</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>

          {/* Collapsed: icon + expand button */}
          <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
            <SidebarMenuButton size="lg" asChild tooltip="Castparty">
              <Link href="/home">
                <Image
                  src="/icon.svg"
                  alt="Castparty"
                  width={32}
                  height={32}
                  className="shrink-0"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
            <SidebarMenuButton tooltip="Expand sidebar" onClick={toggleSidebar}>
              <PanelLeftOpenIcon />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default">
              <Avatar size="sm">
                {user.image && <AvatarImage src={user.image} alt={user.name} />}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium text-label">
                  {user.name}
                </span>
                <span className="truncate font-normal text-caption text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator />
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log out" onClick={handleLogOut}>
              <LogOutIcon />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
