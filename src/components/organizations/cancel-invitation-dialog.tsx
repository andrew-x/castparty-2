"use client"

import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { cancelInvitation } from "@/actions/organizations/cancel-invitation"
import { Alert, AlertDescription } from "@/components/common/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/common/alert-dialog"

interface Props {
  organizationId: string
  invitation: { id: string; email: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CancelInvitationDialog({
  organizationId,
  invitation,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { execute, isPending } = useAction(cancelInvitation, {
    onSuccess() {
      onOpenChange(false)
      router.refresh()
    },
    onError({ error: e }) {
      setError(
        e.serverError ?? "We couldn't cancel this invitation. Try again.",
      )
    },
  })

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setError(null)
    onOpenChange(nextOpen)
  }

  function handleConfirm() {
    if (!invitation) return
    setError(null)
    execute({ invitationId: invitation.id, organizationId })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel invitation</AlertDialogTitle>
          <AlertDialogDescription>
            The invitation to {invitation?.email} will be cancelled. You can
            invite them again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep invitation</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Cancelling..." : "Cancel invitation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
