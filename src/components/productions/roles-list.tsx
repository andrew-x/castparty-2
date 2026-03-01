"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { createRole } from "@/actions/productions/create-role"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { Textarea } from "@/components/common/textarea"

const addRoleSchema = z.object({
  name: z.string().min(1, "Role name is required.").max(100),
  description: z.string().optional(),
})

interface Role {
  id: string
  name: string
  description: string | null
}

interface Props {
  productionId: string
  initialRoles: Role[]
}

export function RolesList({ productionId, initialRoles }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  const form = useForm<z.infer<typeof addRoleSchema>>({
    resolver: zodResolver(addRoleSchema),
    defaultValues: { name: "", description: "" },
  })

  const { execute, isPending } = useAction(createRole, {
    onSuccess() {
      form.reset()
      setShowForm(false)
      router.refresh()
    },
    onError({ error }) {
      form.setError("root", {
        message: error.serverError ?? "We couldn't add the role. Try again.",
      })
    },
  })

  return (
    <div className="flex flex-col gap-block">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-heading">Roles</h2>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <PlusIcon className="size-4" />
            Add role
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={form.handleSubmit((v) => execute({ ...v, productionId }))}
          className="rounded-lg border p-group"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Role name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="e.g. Stage Manager"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>
                    Description (optional)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    placeholder="Brief description of this role"
                    rows={2}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
            <div className="flex justify-end gap-element">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  form.reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Add role
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}

      {initialRoles.length === 0 && !showForm && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserIcon />
            </EmptyMedia>
            <EmptyTitle>No roles yet</EmptyTitle>
            <EmptyDescription>
              Add the roles you're casting for to start receiving auditions.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => setShowForm(true)}>
              <PlusIcon className="size-4" />
              Add role
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {initialRoles.length > 0 && (
        <div className="flex flex-col gap-element">
          {initialRoles.map((role) => (
            <div
              key={role.id}
              className="flex items-start gap-element rounded-lg border p-group"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <UserIcon className="size-4 text-foreground" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="font-medium text-foreground text-label">
                  {role.name}
                </h3>
                {role.description && (
                  <p className="text-caption text-muted-foreground">
                    {role.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
