"use client"

import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { transferOwnership } from "@/actions/organizations/transfer-ownership"
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
  member: { id: string; userName: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferOwnershipDialog({
  organizationId,
  member: targetMember,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { execute, isPending } = useAction(transferOwnership, {
    onSuccess() {
      onOpenChange(false)
      router.refresh()
    },
    onError({ error: e }) {
      setError(e.serverError ?? "We couldn't transfer ownership. Try again.")
    },
  })

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setError(null)
    onOpenChange(nextOpen)
  }

  function handleConfirm() {
    if (!targetMember) return
    setError(null)
    execute({ organizationId, memberId: targetMember.id })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer ownership</AlertDialogTitle>
          <AlertDialogDescription>
            This will make {targetMember?.userName} the owner of this
            organization. You will become an admin. This action cannot be undone
            without the new owner's cooperation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Transferring..." : "Transfer ownership"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
