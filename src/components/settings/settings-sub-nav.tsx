"use client"

import { Building2Icon, UserCircleIcon, UsersIcon } from "lucide-react"
import { SubNav } from "@/components/common/sub-nav"

export function SettingsSubNav() {
  return (
    <SubNav
      items={[
        { label: "Organization", href: "/settings", icon: Building2Icon },
        { label: "Members", href: "/settings/members", icon: UsersIcon },
        { label: "Account", href: "/settings/account", icon: UserCircleIcon },
      ]}
    />
  )
}
