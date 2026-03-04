"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { updateRole } from "@/actions/productions/update-role"
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
import { ShareLink } from "@/components/common/share-link"
import { Switch } from "@/components/common/switch"
import { Textarea } from "@/components/common/textarea"
import { getAppUrl } from "@/lib/url"

const schema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim(),
  slug: z
    .string()
    .trim()
    .min(3, "URL ID must be at least 3 characters.")
    .max(60, "URL ID must be at most 60 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers, and hyphens only.",
    ),
  isOpen: z.boolean(),
})

interface Props {
  roleId: string
  orgSlug: string
  productionSlug: string
  currentName: string
  currentSlug: string
  currentDescription: string
  currentIsOpen: boolean
}

export function RoleSettingsForm({
  roleId,
  orgSlug,
  productionSlug,
  currentName,
  currentSlug,
  currentDescription,
  currentIsOpen,
}: Props) {
  const router = useRouter()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: currentName,
      description: currentDescription,
      slug: currentSlug,
      isOpen: currentIsOpen,
    },
  })

  const { execute: executeUpdate, isPending: isUpdating } = useAction(
    updateRole,
    {
      onError({ error }) {
        form.setError("root", {
          message:
            error.serverError ?? "We couldn't update the role. Try again.",
        })
      },
    },
  )

  const { execute: executeSlugUpdate, isPending: isUpdatingSlug } = useAction(
    updateRoleSlug,
    {
      onError({ error }) {
        form.setError("slug", {
          message:
            error.serverError ?? "We couldn't update the URL ID. Try again.",
        })
      },
    },
  )

  const watched = form.watch()

  async function onSubmit(values: z.infer<typeof schema>) {
    const roleChanged =
      values.name !== currentName ||
      values.description !== currentDescription ||
      values.isOpen !== currentIsOpen
    const slugChanged = values.slug !== currentSlug

    if (roleChanged) {
      executeUpdate({
        roleId,
        name: values.name,
        description: values.description,
        isOpen: values.isOpen,
      })
    }

    if (slugChanged) {
      executeSlugUpdate({ roleId, slug: values.slug })
    }

    router.refresh()
  }

  const auditionUrl = getAppUrl(
    `/s/${orgSlug}/${productionSlug}/${watched.slug || currentSlug}`,
  )

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
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
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                rows={3}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="isOpen"
          control={form.control}
          render={({ field }) => (
            <Field>
              <div className="flex items-center gap-element">
                <Switch
                  id={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor={field.name}>
                  Accepting submissions
                </FieldLabel>
              </div>
            </Field>
          )}
        />

        <Controller
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>URL ID</FieldLabel>
              <p className="text-caption text-muted-foreground">
                This controls the URL for this role's audition page.
              </p>
              <Input
                {...field}
                id={field.name}
                type="text"
                aria-invalid={fieldState.invalid}
              />
              <p className="text-caption text-muted-foreground">
                Preview: <strong>{auditionUrl}</strong>
              </p>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <ShareLink
          title="Audition page"
          description="Share this link with candidates so they can audition for this role."
          url={getAppUrl(`/s/${orgSlug}/${productionSlug}/${currentSlug}`)}
          href={`/s/${orgSlug}/${productionSlug}/${currentSlug}`}
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
          loading={isUpdating || isUpdatingSlug}
          disabled={!hasChanges}
        >
          Save
        </Button>
      </FieldGroup>
    </form>
  )
}
