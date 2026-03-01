"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { updateProductionSlug } from "@/actions/productions/update-production-slug"
import { updateRoleSlug } from "@/actions/productions/update-role-slug"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { Separator } from "@/components/common/separator"

const slugSchema = z
  .string()
  .trim()
  .min(3, "URL ID must be at least 3 characters.")
  .max(60, "URL ID must be at most 60 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Lowercase letters, numbers, and hyphens only.",
  )

const productionSlugSchema = z.object({
  slug: slugSchema,
})

interface RoleInfo {
  id: string
  name: string
  slug: string
}

interface Props {
  productionId: string
  orgSlug: string
  currentProductionSlug: string
  roles: RoleInfo[]
}

export function ProductionSettingsForm({
  productionId,
  orgSlug,
  currentProductionSlug,
  roles,
}: Props) {
  return (
    <div className="flex flex-col gap-section">
      <section className="flex flex-col gap-group">
        <h2 className="font-serif text-heading">Production URL</h2>
        <ProductionSlugEditor
          productionId={productionId}
          orgSlug={orgSlug}
          currentSlug={currentProductionSlug}
        />
      </section>

      {roles.length > 0 && (
        <>
          <Separator />
          <section className="flex flex-col gap-group">
            <h2 className="font-serif text-heading">Role URLs</h2>
            <div className="flex flex-col gap-block">
              {roles.map((role) => (
                <RoleSlugEditor
                  key={role.id}
                  roleId={role.id}
                  roleName={role.name}
                  orgSlug={orgSlug}
                  productionSlug={currentProductionSlug}
                  currentSlug={role.slug}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function ProductionSlugEditor({
  productionId,
  orgSlug,
  currentSlug,
}: {
  productionId: string
  orgSlug: string
  currentSlug: string
}) {
  const router = useRouter()
  const form = useForm<z.infer<typeof productionSlugSchema>>({
    resolver: zodResolver(productionSlugSchema),
    defaultValues: { slug: currentSlug },
  })

  const { execute, isPending } = useAction(updateProductionSlug, {
    onSuccess() {
      router.refresh()
    },
    onError({ error }) {
      form.setError("root", {
        message:
          error.serverError ?? "We couldn't update the URL ID. Try again.",
      })
    },
  })

  const watchedSlug = form.watch("slug")
  const hasChanges = watchedSlug !== currentSlug

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        execute({ productionId, slug: v.slug }),
      )}
    >
      <FieldGroup>
        <Controller
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Production URL ID</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                aria-invalid={fieldState.invalid}
              />
              <p className="text-caption text-muted-foreground">
                /submit/{orgSlug}/{watchedSlug || "..."}
              </p>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
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
        <Button
          type="submit"
          variant="outline"
          size="sm"
          loading={isPending}
          disabled={!hasChanges}
        >
          Save
        </Button>
      </FieldGroup>
    </form>
  )
}

function RoleSlugEditor({
  roleId,
  roleName,
  orgSlug,
  productionSlug,
  currentSlug,
}: {
  roleId: string
  roleName: string
  orgSlug: string
  productionSlug: string
  currentSlug: string
}) {
  const router = useRouter()
  const roleSlugSchema = z.object({ slug: slugSchema })
  const form = useForm<z.infer<typeof roleSlugSchema>>({
    resolver: zodResolver(roleSlugSchema),
    defaultValues: { slug: currentSlug },
  })

  const { execute, isPending } = useAction(updateRoleSlug, {
    onSuccess() {
      router.refresh()
    },
    onError({ error }) {
      form.setError("root", {
        message:
          error.serverError ?? "We couldn't update the URL ID. Try again.",
      })
    },
  })

  const watchedSlug = form.watch("slug")
  const hasChanges = watchedSlug !== currentSlug

  return (
    <form
      onSubmit={form.handleSubmit((v) => execute({ roleId, slug: v.slug }))}
      className="rounded-lg border p-group"
    >
      <FieldGroup>
        <Controller
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={`role-slug-${roleId}`}>
                {roleName}
              </FieldLabel>
              <Input
                {...field}
                id={`role-slug-${roleId}`}
                type="text"
                aria-invalid={fieldState.invalid}
              />
              <p className="text-caption text-muted-foreground">
                /submit/{orgSlug}/{productionSlug}/{watchedSlug || "..."}
              </p>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
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
        <Button
          type="submit"
          variant="outline"
          size="sm"
          loading={isPending}
          disabled={!hasChanges}
        >
          Save
        </Button>
      </FieldGroup>
    </form>
  )
}
