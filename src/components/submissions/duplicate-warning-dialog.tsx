"use client"

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

interface DuplicateRole {
  roleId: string
  roleName: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicateRoles: DuplicateRole[]
  newRoleCount: number
  onConfirm: () => void
  loading: boolean
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  duplicateRoles,
  newRoleCount,
  onConfirm,
  loading,
}: Props) {
  const roleNames = duplicateRoles.map((r) => r.roleName)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            You've already submitted{" "}
            {duplicateRoles.length === 1
              ? "for this role"
              : "for some of these roles"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-element">
              <p>
                You have an existing submission for:{" "}
                <strong>{roleNames.join(", ")}</strong>. Confirming will update{" "}
                {duplicateRoles.length === 1
                  ? "that submission"
                  : "those submissions"}{" "}
                with the information you entered. Your position in the review
                process won't change.
              </p>
              {newRoleCount > 0 && (
                <p>
                  You'll also be submitted for {newRoleCount} new{" "}
                  {newRoleCount === 1 ? "role" : "roles"}.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? "Submitting..." : "Update and submit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
