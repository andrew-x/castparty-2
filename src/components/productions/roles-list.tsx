"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { LockIcon, PlusIcon, UserIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { createRole } from "@/actions/productions/create-role"
import { Alert, AlertDescription } from "@/components/common/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"
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
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim().optional(),
})

interface StageCount {
  name: string
  type: "APPLIED" | "SELECTED" | "REJECTED" | "CUSTOM"
  count: number
}

interface RoleRow {
  id: string
  name: string
  isOpen: boolean
  stageCounts: StageCount[]
}

interface Props {
  productionId: string
  roles: RoleRow[]
}

export function RolesList({ productionId, roles }: Props) {
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
          <Button
            variant="outline"
            size="sm"
            leftSection={<PlusIcon />}
            onClick={() => setShowForm(true)}
          >
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

      {roles.length === 0 && !showForm && (
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
            <Button
              variant="outline"
              leftSection={<PlusIcon />}
              onClick={() => setShowForm(true)}
            >
              Add role
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {roles.length > 0 && (
        <div className="divide-y rounded-lg border">
          {[...roles]
            .sort((a, b) => {
              if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1
              return a.name.localeCompare(b.name)
            })
            .map((role) => {
              const total = role.stageCounts.reduce((s, c) => s + c.count, 0)
              return (
                <Link
                  key={role.id}
                  href={`/productions/${productionId}/roles/${role.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  {role.isOpen ? (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                      <UserIcon className="size-4 text-brand" />
                    </div>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <LockIcon className="size-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>This role is closed</TooltipContent>
                    </Tooltip>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-foreground text-label">
                      {role.name}
                    </span>
                    {role.stageCounts.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {role.stageCounts.map((stage) => (
                          <span
                            key={stage.name}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-px text-caption ${stage.count > 0 ? "bg-muted text-muted-foreground" : "text-muted-foreground/60"}`}
                          >
                            {stage.name}
                            <span
                              className={`font-semibold ${stage.count > 0 ? "text-foreground" : "text-muted-foreground/40"}`}
                            >
                              {stage.count}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 tabular-nums text-caption text-muted-foreground">
                    {total === 1
                      ? "1 candidate"
                      : total > 0
                        ? `${total} candidates`
                        : null}
                  </span>
                </Link>
              )
            })}
        </div>
      )}
    </div>
  )
}
