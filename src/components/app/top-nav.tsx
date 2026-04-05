"use client"

import {
  ClapperboardIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { UserInvitation } from "@/actions/organizations/get-user-invitations"
import { Button } from "@/components/common/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/common/sheet"
import {
  OrgSwitcher,
  type OrgSwitcherOrg,
} from "@/components/organizations/org-switcher"
import { PendingInvitesButton } from "@/components/organizations/pending-invites-button"
import { cn } from "@/lib/util"

const navItems = [
  { label: "Home", href: "/home", icon: LayoutDashboardIcon },
  { label: "Productions", href: "/productions", icon: ClapperboardIcon },
  { label: "Candidates", href: "/candidates", icon: UsersIcon },
]

interface Props {
  user: {
    firstName: string
    lastName: string
    email: string
    image?: string | null
  }
  organizations: OrgSwitcherOrg[]
  activeOrgId: string | null
  activeOrgRole: string | null
  pendingInvitations: UserInvitation[]
}

export function TopNav({
  user,
  organizations,
  activeOrgId,
  activeOrgRole,
  pendingInvitations,
}: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const canManageOrg = activeOrgRole === "owner" || activeOrgRole === "admin"

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  // Close mobile sheet when pathname changes
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-border border-b bg-background px-page">
      {/* Logo */}
      <Link href="/home" className="mr-6 shrink-0">
        <Image src="/logo.svg" alt="Castparty" width={140} height={28} />
      </Link>

      {/* Desktop nav links */}
      <nav className="hidden items-center gap-0.5 md:flex">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            isActive={isActive(item.href)}
          />
        ))}
        {canManageOrg && (
          <NavLink
            href="/settings"
            label="Settings"
            isActive={isActive("/settings")}
          />
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-element">
        <PendingInvitesButton invitations={pendingInvitations} />
        <OrgSwitcher
          user={user}
          organizations={organizations}
          activeOrgId={activeOrgId}
        />
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="ml-2"
          tooltip="Open menu"
        >
          <MenuIcon />
        </Button>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>
                <Image
                  src="/logo.svg"
                  alt="Castparty"
                  width={120}
                  height={24}
                />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {navItems.map((item) => (
                <MobileNavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive(item.href)}
                />
              ))}
              {canManageOrg && (
                <MobileNavLink
                  href="/settings"
                  icon={SettingsIcon}
                  label="Settings"
                  isActive={isActive("/settings")}
                />
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-2.5 py-1 font-medium text-label-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </Link>
  )
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 font-medium text-body transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      <span>{label}</span>
    </Link>
  )
}
