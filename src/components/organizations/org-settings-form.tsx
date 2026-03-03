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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { ShareLink } from "@/components/common/share-link"
import { Switch } from "@/components/common/switch"
import { Textarea } from "@/components/common/textarea"
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
  description: z.string().trim().max(500),
  websiteUrl: z.string().trim().url().or(z.literal("")),
  isOrganizationProfileOpen: z.boolean(),
})

interface Props {
  organizationId: string
  currentName: string
  currentSlug: string
  currentDescription: string
  currentWebsiteUrl: string
  currentIsOrganizationProfileOpen: boolean
  auditionUrl: string
}

export function OrgSettingsForm({
  organizationId,
  currentName,
  currentSlug,
  currentDescription,
  currentWebsiteUrl,
  currentIsOrganizationProfileOpen,
  auditionUrl,
}: Props) {
  const router = useRouter()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: currentName,
      slug: currentSlug,
      description: currentDescription,
      websiteUrl: currentWebsiteUrl,
      isOrganizationProfileOpen: currentIsOrganizationProfileOpen,
    },
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

  const watched = form.watch()
  const hasChanges =
    watched.name !== currentName ||
    watched.slug !== currentSlug ||
    watched.description !== currentDescription ||
    watched.websiteUrl !== currentWebsiteUrl ||
    watched.isOrganizationProfileOpen !== currentIsOrganizationProfileOpen

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
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>About</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                placeholder="Tell candidates about your organization"
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

        <Controller
          name="websiteUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Website</FieldLabel>
              <p className="text-caption text-muted-foreground">
                Your organization's external website, outside of Castparty.
              </p>
              <Input
                {...field}
                id={field.name}
                type="url"
                placeholder="https://your-theatre.org"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="isOrganizationProfileOpen"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Organization profile open</FieldTitle>
                <FieldDescription>
                  When on, your organization page shows all open roles across
                  all productions. When off, candidates can only reach auditions
                  via direct links.
                </FieldDescription>
              </FieldContent>
              <Switch
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </Field>
          )}
        />

        <ShareLink
          title="Your organization page"
          description="Share this link with candidates so they can find all your casting calls across all productions. Post it on social media, your website, or in audition notices."
          url={auditionUrl}
          href={`/s/${currentSlug}`}
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
