"use client"

import { useState } from "react"
import type { UserInvitation } from "@/actions/organizations/get-user-invitations"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { authClient } from "@/lib/auth/auth-client"

interface Props {
  invitations: UserInvitation[]
  onAccept: (id: string) => void
  onIgnore: (id: string) => void
}

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function OnboardingInvitationList({
  invitations,
  onAccept,
  onIgnore,
}: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        onAccept(invitation.id)
        setError("This invitation was cancelled or expired.")
        return
      }
      setError(
        acceptError.message ?? "We couldn't accept this invitation. Try again.",
      )
      return
    }

    await authClient.organization.setActive({
      organizationId: invitation.organizationId,
    })

    onAccept(invitation.id)
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

    onIgnore(invitation.id)
  }

  return (
    <div className="flex flex-col gap-block">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
  )
}
