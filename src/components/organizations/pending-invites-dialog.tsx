"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { UserInvitation } from "@/actions/organizations/get-user-invitations"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog"
import { authClient } from "@/lib/auth/auth-client"

interface Props {
  invitations: UserInvitation[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function PendingInvitesDialog({
  invitations: initialInvitations,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [invitations, setInvitations] = useState(initialInvitations)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sync with server data when dialog opens with new props
  useEffect(() => {
    if (open && loadingId === null) {
      setInvitations(initialInvitations)
    }
  }, [open, initialInvitations, loadingId])

  function removeInvitation(id: string) {
    const next = invitations.filter((inv) => inv.id !== id)
    setInvitations(next)
    if (next.length === 0) {
      onOpenChange(false)
    }
  }

  async function handleAccept(invitation: UserInvitation) {
    setLoadingId(invitation.id)
    setError(null)

    const { error: acceptError } =
      await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      })

    setLoadingId(null)

    if (acceptError) {
      if (acceptError.message?.includes("not found")) {
        removeInvitation(invitation.id)
        setError("This invitation was cancelled or expired.")
        return
      }
      setError(
        acceptError.message ?? "We couldn't accept this invitation. Try again.",
      )
      return
    }

    onOpenChange(false)
    router.refresh()
  }

  async function handleIgnore(invitation: UserInvitation) {
    setLoadingId(invitation.id)
    setError(null)

    const { error: rejectError } =
      await authClient.organization.rejectInvitation({
        invitationId: invitation.id,
      })

    setLoadingId(null)

    if (rejectError) {
      setError(
        rejectError.message ?? "We couldn't ignore this invitation. Try again.",
      )
      return
    }

    removeInvitation(invitation.id)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null)
      setLoadingId(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pending invitations</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-block">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-element"
            >
              <div className="flex min-w-0 items-center gap-element">
                <span className="truncate font-medium text-foreground text-label">
                  {inv.organizationName}
                </span>
                <Badge variant="outline">{roleLabel(inv.role)}</Badge>
              </div>
              <div className="flex shrink-0 items-center gap-element">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleIgnore(inv)}
                  disabled={loadingId !== null}
                >
                  {loadingId === inv.id ? "Ignoring..." : "Ignore"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(inv)}
                  disabled={loadingId !== null}
                >
                  {loadingId === inv.id ? "Accepting..." : "Accept"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
