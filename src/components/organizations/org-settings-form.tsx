"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { presignLogoUpload } from "@/actions/organizations/presign-logo-upload"
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
import { ImageUploader } from "@/components/common/image-uploader"
import { Input } from "@/components/common/input"
import { RichTextEditor } from "@/components/common/rich-text-editor"
import { ShareLink } from "@/components/common/share-link"
import { Switch } from "@/components/common/switch"
import { updateOrgFormSchema } from "@/lib/schemas/organization"
import { formResolver } from "@/lib/schemas/resolve"
import { getAppUrl } from "@/lib/url"

interface Props {
  organizationId: string
  currentName: string
  currentSlug: string
  currentLogo: string | null
  currentDescription: string
  currentWebsiteUrl: string
  currentIsOrganizationProfileOpen: boolean
  auditionUrl: string
}

export function OrgSettingsForm({
  organizationId,
  currentName,
  currentSlug,
  currentLogo,
  currentDescription,
  currentWebsiteUrl,
  currentIsOrganizationProfileOpen,
  auditionUrl,
}: Props) {
  const router = useRouter()
  const { form, action } = useHookFormAction(
    updateOrganization,
    formResolver(updateOrgFormSchema),
    {
      formProps: {
        defaultValues: {
          name: currentName,
          slug: currentSlug,
          logo: currentLogo ?? "",
          description: currentDescription,
          websiteUrl: currentWebsiteUrl,
          isOrganizationProfileOpen: currentIsOrganizationProfileOpen,
        },
      },
      actionProps: {
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
      },
    },
  )

  const watched = form.watch()
  const hasChanges =
    watched.name !== currentName ||
    watched.slug !== currentSlug ||
    (watched.logo ?? "") !== (currentLogo ?? "") ||
    watched.description !== currentDescription ||
    watched.websiteUrl !== currentWebsiteUrl ||
    watched.isOrganizationProfileOpen !== currentIsOrganizationProfileOpen

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        action.execute({ ...v, organizationId, logo: v.logo || null }),
      )}
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
          name="logo"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <ImageUploader
                value={field.value || null}
                onChange={(url) => field.onChange(url ?? "")}
                presignAction={(input) =>
                  presignLogoUpload({ ...input, organizationId })
                }
                maxSizeMb={5}
                aspectHint="1:1"
                maxWidth={120}
                label="Upload logo"
              />
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>About</FieldLabel>
              <RichTextEditor
                value={field.value ?? ""}
                onChange={field.onChange}
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
              <FieldLabel htmlFor={field.name}>URL slug</FieldLabel>
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
                <FieldTitle>Show audition page publicly</FieldTitle>
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
          loading={action.isPending}
          disabled={!hasChanges}
        >
          Save
        </Button>
      </FieldGroup>
    </form>
  )
}
