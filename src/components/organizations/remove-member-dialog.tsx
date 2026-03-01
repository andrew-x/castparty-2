"use client"

import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { removeMember } from "@/actions/organizations/remove-member"
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

export function RemoveMemberDialog({
  organizationId,
  member: targetMember,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { execute, isPending } = useAction(removeMember, {
    onSuccess() {
      onOpenChange(false)
      router.refresh()
    },
    onError({ error: e }) {
      setError(e.serverError ?? "We couldn't remove this member. Try again.")
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
          <AlertDialogTitle>Remove member</AlertDialogTitle>
          <AlertDialogDescription>
            {targetMember?.userName} will lose access to this organization. You
            can invite them again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
