"use client"

import { MailIcon } from "lucide-react"
import { useState } from "react"
import type { UserInvitation } from "@/actions/organizations/get-user-invitations"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { PendingInvitesDialog } from "@/components/organizations/pending-invites-dialog"

interface Props {
  invitations: UserInvitation[]
}

export function PendingInvitesButton({ invitations }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  if (invitations.length === 0) return null

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDialogOpen(true)}
        tooltip="Invitations"
        className="relative"
      >
        <MailIcon />
        <Badge className="absolute -top-1 -right-1 size-4 p-0 text-caption">
          {invitations.length}
        </Badge>
      </Button>

      <PendingInvitesDialog
        invitations={invitations}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
