"use client"

import { MailIcon } from "lucide-react"
import { useState } from "react"
import type { UserInvitation } from "@/actions/organizations/get-user-invitations"
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/common/sidebar"
import { PendingInvitesDialog } from "./pending-invites-dialog"

interface Props {
  invitations: UserInvitation[]
}

export function PendingInvitesButton({ invitations }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  if (invitations.length === 0) return null

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip="Invitations"
        onClick={() => setDialogOpen(true)}
      >
        <MailIcon />
        <span>Invitations</span>
      </SidebarMenuButton>
      <SidebarMenuBadge>{invitations.length}</SidebarMenuBadge>

      <PendingInvitesDialog
        invitations={invitations}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </SidebarMenuItem>
  )
}
