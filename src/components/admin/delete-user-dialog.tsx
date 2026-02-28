"use client"

import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { deleteUserAction } from "@/actions/admin/delete-user"
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
  user: { id: string; name: string; email: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { execute, isPending } = useAction(deleteUserAction, {
    onSuccess() {
      setErrorMessage(null)
      onOpenChange(false)
      onSuccess()
    },
    onError({ error }) {
      setErrorMessage(error.serverError ?? "Something went wrong.")
    },
  })

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setErrorMessage(null)
        onOpenChange(v)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {user?.name} ({user?.email}) and all
            associated data. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => user && execute({ userId: user.id })}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
