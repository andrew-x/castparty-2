"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { updateProduction } from "@/actions/productions/update-production"
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
import { getAppUrl } from "@/lib/url"

const schema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
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
  productionId: string
  orgSlug: string
  currentName: string
  currentSlug: string
}

export function ProductionSettingsForm({
  productionId,
  orgSlug,
  currentName,
  currentSlug,
}: Props) {
  const router = useRouter()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: currentName, slug: currentSlug },
  })

  const { execute, isPending } = useAction(updateProduction, {
    onSuccess() {
      router.refresh()
    },
    onError({ error }) {
      form.setError("root", {
        message:
          error.serverError ?? "We couldn't update the production. Try again.",
      })
    },
  })

  const watched = form.watch()
  const hasChanges =
    watched.name !== currentName || watched.slug !== currentSlug

  const auditionUrl = getAppUrl(`/s/${orgSlug}/${watched.slug || currentSlug}`)

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        execute({ productionId, name: v.name, slug: v.slug }),
      )}
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Production name</FieldLabel>
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
              <p className="text-caption text-muted-foreground">
                This controls the URL for your production's audition page.
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
          description="Share this link with candidates so they can find all the roles in this production. Post it on social media, your website, or in audition notices."
          url={getAppUrl(`/s/${orgSlug}/${currentSlug}`)}
          href={`/s/${orgSlug}/${currentSlug}`}
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
