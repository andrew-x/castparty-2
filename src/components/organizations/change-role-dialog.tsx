"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
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
  role: z.enum(["admin", "member"]),
})

interface Props {
  organizationId: string
  member: { id: string; userName: string; role: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangeRoleDialog({
  organizationId,
  member: targetMember,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { role: "member" },
  })

  // Reset form when a different member is selected
  useEffect(() => {
    if (targetMember && targetMember.role !== "owner") {
      form.reset({ role: targetMember.role as "admin" | "member" })
    }
  }, [targetMember, form])

  const { execute, isPending } = useAction(updateMemberRole, {
    onSuccess() {
      onOpenChange(false)
      router.refresh()
    },
    onError({ error }) {
      form.setError("root", {
        message: error.serverError ?? "We couldn't update the role. Try again.",
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role for {targetMember?.userName}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => {
            if (!targetMember) return
            execute({
              organizationId,
              memberId: targetMember.id,
              role: v.role,
            })
          })}
        >
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
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" loading={isPending}>
              Update role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
