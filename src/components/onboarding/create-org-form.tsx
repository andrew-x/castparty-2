"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { createOrganization } from "@/actions/organizations/create-organization"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { getAppUrl } from "@/lib/url"

function toUrlId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

const createOrgSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required."),
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

export function CreateOrgForm({
  onComplete,
}: {
  onComplete?: (organizationId: string) => void
} = {}) {
  const router = useRouter()
  const form = useForm<z.infer<typeof createOrgSchema>>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "", slug: "" },
  })

  const { execute, isPending } = useAction(createOrganization, {
    onSuccess({ data }) {
      if (onComplete && data?.organizationId) {
        onComplete(data.organizationId)
      } else {
        router.refresh()
        router.push("/home")
      }
    },
    onError({ error }) {
      form.setError("root", {
        message:
          error.serverError ??
          "We couldn't create the organization. Try again.",
      })
    },
  })

  const watchedSlug = form.watch("slug")
  const slugManuallyEdited = useRef(false)

  function handleNameChange(name: string, onChange: (value: string) => void) {
    onChange(name)
    if (!slugManuallyEdited.current) {
      form.setValue("slug", toUrlId(name), { shouldValidate: true })
    }
  }

  function handleSlugChange(value: string, onChange: (value: string) => void) {
    onChange(value)
    slugManuallyEdited.current = value !== toUrlId(form.getValues("name"))
  }

  return (
    <form onSubmit={form.handleSubmit((v) => execute(v))}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Organization name</FieldLabel>
              <Input
                {...field}
                onChange={(e) =>
                  handleNameChange(e.target.value, field.onChange)
                }
                id={field.name}
                type="text"
                placeholder="e.g. Riverside Community Theatre"
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
                onChange={(e) =>
                  handleSlugChange(e.target.value, field.onChange)
                }
                id={field.name}
                type="text"
                placeholder="e.g. riverside-community-theatre"
                aria-invalid={fieldState.invalid}
              />
              <p className="break-all text-caption text-muted-foreground">
                Your organization page will be at <br />{" "}
                <strong>{getAppUrl(`/s/${watchedSlug || "..."}`)}</strong>
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
        <Button type="submit" loading={isPending} className="w-full">
          Create organization
        </Button>
      </FieldGroup>
    </form>
  )
}
