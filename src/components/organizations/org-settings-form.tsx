"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { LinkIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { updateOrganization } from "@/actions/organizations/update-organization"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import { CopyButton } from "@/components/common/copy-button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { getAppUrl } from "@/lib/url"

const schema = z.object({
  name: z.string().trim().min(1, "Organization name is required.").max(100),
  slug: z
    .string()
    .trim()
    .min(3, "Must be at least 3 characters.")
    .max(60, "Must be at most 60 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use only lowercase letters, numbers, and hyphens.",
    ),
})

interface Props {
  organizationId: string
  currentName: string
  currentSlug: string
  auditionUrl: string
}

export function OrgSettingsForm({
  organizationId,
  currentName,
  currentSlug,
  auditionUrl,
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
                onChange={(event) => {
                  field.onChange(event.target.value)
                }}
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
                This controls the URL for your organization. Pick something
                short and easy to remember, like your organization name or
                initials.
              </p>
              <Input
                {...field}
                id={field.name}
                type="text"
                aria-invalid={fieldState.invalid}
              />
              <p className="text-caption text-muted-foreground">
                Preview:{" "}
                <strong>{getAppUrl(`/s/${field.value || currentSlug}`)}</strong>
              </p>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="flex flex-col gap-group pt-block">
          <div className="flex flex-col gap-element">
            <p className="font-medium text-foreground text-label">
              Your organization page
            </p>
            <p className="text-caption text-muted-foreground">
              Share this link with candidates so they can find all your casting
              calls across all productions. Post it on social media, your
              website, or in audition notices.
            </p>
          </div>

          <div className="flex items-center gap-element rounded-md border bg-muted px-group py-element">
            <p className="flex-1 break-all font-mono text-caption text-foreground">
              {auditionUrl}
            </p>
            <CopyButton value={auditionUrl} />
            <Button
              href={`/s/${currentSlug}`}
              variant="ghost"
              size="sm"
              leftSection={<LinkIcon />}
            >
              View page
            </Button>
          </div>
        </div>

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
