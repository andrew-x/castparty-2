"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { updateOrganization } from "@/actions/organizations/update-organization"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"

const schema = z.object({
  name: z.string().trim().min(1, "Organization name is required.").max(100),
  slug: z
    .string()
    .trim()
    .min(3, "URL ID must be at least 3 characters.")
    .max(60, "URL ID must be at most 60 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers, and hyphens only.",
    ),
})

interface Props {
  organizationId: string
  currentName: string
  currentSlug: string
}

export function OrgSettingsForm({
  organizationId,
  currentName,
  currentSlug,
}: Props) {
  const router = useRouter()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: currentName, slug: currentSlug },
  })

  const { execute, isPending } = useAction(updateOrganization, {
    onSuccess() {
      router.refresh()
    },
    onError({ error }) {
      form.setError("root", {
        message:
          error.serverError ??
          "We couldn't update the organization. Try again.",
      })
    },
  })

  const watchedName = form.watch("name")
  const watchedSlug = form.watch("slug")
  const hasChanges = watchedName !== currentName || watchedSlug !== currentSlug

  return (
    <form
      onSubmit={form.handleSubmit((v) => execute({ ...v, organizationId }))}
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Organization name</FieldLabel>
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
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>URL ID</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                aria-invalid={fieldState.invalid}
              />
              <p className="text-caption text-muted-foreground">
                /submit/{watchedSlug || "..."}
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
