"use client"

import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { deleteOrganizationAction } from "@/actions/admin/delete-organization"
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
  org: { id: string; name: string; slug: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteOrgDialog({ org, open, onOpenChange, onSuccess }: Props) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { execute, isPending } = useAction(deleteOrganizationAction, {
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
          <AlertDialogTitle>Delete organization?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {org?.name} and all its productions,
            roles, and submissions. This cannot be undone.
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
            onClick={() => org && execute({ organizationId: org.id })}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
