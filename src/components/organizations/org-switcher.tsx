"use client"

import {
  BuildingIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  PlusIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { setActiveOrganization } from "@/actions/organizations/set-active-organization"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/avatar"
import { Button } from "@/components/common/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/popover"
import { SidebarMenuButton } from "@/components/common/sidebar"
import { authClient } from "@/lib/auth/auth-client"
import { CreateOrgDialog } from "./create-org-dialog"

export interface OrgSwitcherOrg {
  id: string
  name: string
  slug: string
  logo: string | null
  role: string
}

interface Props {
  user: { name: string; email: string; image?: string | null }
  organizations: OrgSwitcherOrg[]
  activeOrgId: string | null
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function OrgSwitcher({ user, organizations, activeOrgId }: Props) {
  const router = useRouter()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const activeOrg = organizations.find((o) => o.id === activeOrgId)

  const { execute: switchOrg } = useAction(setActiveOrganization, {
    onSuccess() {
      router.refresh()
    },
  })

  function handleSwitch(orgId: string) {
    setPopoverOpen(false)
    if (orgId !== activeOrgId) {
      switchOrg({ organizationId: orgId })
    }
  }

  function handleCreateNew() {
    setPopoverOpen(false)
    setCreateOpen(true)
  }

  async function handleLogOut() {
    setPopoverOpen(false)
    await authClient.signOut()
    router.push("/auth")
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <SidebarMenuButton size="lg" className="w-full" tooltip={user.name}>
            <Avatar size="sm">
              {user.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-medium text-label">
                {user.name}
              </span>
              <span className="truncate font-normal text-caption text-muted-foreground">
                {activeOrg?.name ?? user.email}
              </span>
            </div>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1" align="start" side="right">
          <div className="flex flex-col">
            <div className="px-2 py-1.5">
              <p className="truncate font-medium text-label">{user.name}</p>
              <p className="truncate text-caption text-muted-foreground">
                {user.email}
              </p>
            </div>
            <div className="my-1 h-px bg-border" />
            <p className="px-2 py-1 text-caption text-muted-foreground">
              Organizations
            </p>
            {organizations.map((org) => (
              <Button
                key={org.id}
                variant="ghost"
                size="sm"
                onClick={() => handleSwitch(org.id)}
                className="h-auto w-full justify-start gap-element px-2 py-1.5"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded bg-accent">
                  <BuildingIcon className="size-3.5 text-muted-foreground" />
                </div>
                <span className="flex-1 truncate text-left">{org.name}</span>
                {org.id === activeOrgId && (
                  <CheckIcon className="size-4 shrink-0 text-primary" />
                )}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateNew}
              className="h-auto w-full justify-start gap-element px-2 py-1.5 text-muted-foreground"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded border border-border border-dashed">
                <PlusIcon className="size-3.5" />
              </div>
              <span>Create organization</span>
            </Button>
            <div className="my-1 h-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogOut}
              className="h-auto w-full justify-start gap-element px-2 py-1.5 text-muted-foreground"
            >
              <div className="flex size-6 shrink-0 items-center justify-center">
                <LogOutIcon className="size-3.5" />
              </div>
              <span>Log out</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
