"use client"

import {
  ClapperboardIcon,
  LayoutDashboardIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  useSidebar,
} from "@/components/common/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"
import {
  OrgSwitcher,
  type OrgSwitcherOrg,
} from "@/components/organizations/org-switcher"

const navItems = [
  { label: "Home", href: "/home", icon: LayoutDashboardIcon },
  { label: "Productions", href: "/productions", icon: ClapperboardIcon },
  { label: "Performers", href: "/performers", icon: UsersIcon },
]

interface Props {
  user: { name: string; email: string; image?: string | null }
  organizations: OrgSwitcherOrg[]
  activeOrgId: string | null
  activeOrgRole: string | null
}

export function AppSidebar({
  user,
  organizations,
  activeOrgId,
  activeOrgRole,
}: Props) {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()

  const canManageOrg = activeOrgRole === "owner" || activeOrgRole === "admin"

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
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
              {canManageOrg && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/settings")}
                    tooltip="Settings"
                  >
                    <Link href="/settings">
                      <SettingsIcon />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <OrgSwitcher
              user={user}
              organizations={organizations}
              activeOrgId={activeOrgId}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
