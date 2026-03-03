"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { transferOwnership } from "@/actions/organizations/transfer-ownership"
import { updateMemberRole } from "@/actions/organizations/update-member-role"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/common/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"

const schema = z.object({
  role: z.enum(["admin", "member", "owner"]),
})

interface Props {
  organizationId: string
  member: { id: string; userName: string; role: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canTransferOwnership?: boolean
}

export function ChangeRoleDialog({
  organizationId,
  member: targetMember,
  open,
  onOpenChange,
  canTransferOwnership,
}: Props) {
  const router = useRouter()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { role: "member" },
  })

  const selectedRole = form.watch("role")

  // Reset form when a different member is selected
  useEffect(() => {
    if (targetMember && targetMember.role !== "owner") {
      form.reset({ role: targetMember.role as "admin" | "member" })
    }
  }, [targetMember, form])

  function handleSuccess() {
    onOpenChange(false)
    router.refresh()
  }

  function handleError(message: string) {
    form.setError("root", { message })
  }

  const updateRole = useAction(updateMemberRole, {
    onSuccess: handleSuccess,
    onError({ error }) {
      handleError(
        error.serverError ?? "We couldn't update the role. Try again.",
      )
    },
  })

  const transfer = useAction(transferOwnership, {
    onSuccess: handleSuccess,
    onError({ error }) {
      handleError(
        error.serverError ?? "We couldn't transfer ownership. Try again.",
      )
    },
  })

  const isPending = updateRole.isPending || transfer.isPending

  function onSubmit(v: z.infer<typeof schema>) {
    if (!targetMember) return
    if (v.role === "owner") {
      transfer.execute({ organizationId, memberId: targetMember.id })
    } else {
      updateRole.execute({
        organizationId,
        memberId: targetMember.id,
        role: v.role,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role for {targetMember?.userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="role"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {canTransferOwnership && (
                        <SelectItem value="owner">Owner</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            {selectedRole === "owner" && (
              <Alert>
                <AlertDescription>
                  This will make {targetMember?.userName} the owner of this
                  organization. You will become an admin.
                </AlertDescription>
              </Alert>
            )}
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="submit"
              variant={selectedRole === "owner" ? "destructive" : "default"}
              loading={isPending}
            >
              {selectedRole === "owner" ? "Transfer ownership" : "Update role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
