"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { LinkIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { updateProduction } from "@/actions/productions/update-production"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import { CopyButton } from "@/components/common/copy-button"
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
import { Switch } from "@/components/common/switch"
import { updateProductionFormSchema } from "@/lib/schemas/production"
import { formResolver } from "@/lib/schemas/resolve"
import { getAppUrl } from "@/lib/url"
import { cn } from "@/lib/util"

interface Props {
  productionId: string
  orgSlug: string
  currentName: string
  currentSlug: string
  isOpen: boolean
}

export function ProductionSettingsForm({
  productionId,
  orgSlug,
  currentName,
  currentSlug,
  isOpen,
}: Props) {
  const router = useRouter()
  const { form, action } = useHookFormAction(
    updateProduction,
    formResolver(updateProductionFormSchema),
    {
      formProps: {
        defaultValues: { name: currentName, slug: currentSlug, isOpen },
      },
      actionProps: {
        onSuccess() {
          router.refresh()
        },
        onError({ error }) {
          form.setError("root", {
            message:
              error.serverError ??
              "We couldn't update the production. Try again.",
          })
        },
      },
    },
  )

  const watched = form.watch()
  const hasChanges =
    watched.name !== currentName ||
    watched.slug !== currentSlug ||
    watched.isOpen !== isOpen

  const auditionUrl = getAppUrl(`/s/${orgSlug}/${watched.slug || currentSlug}`)

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        action.execute({
          productionId,
          name: v.name,
          slug: v.slug,
          isOpen: v.isOpen,
        }),
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

        <Controller
          name="isOpen"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Accepting submissions</FieldTitle>
                <FieldDescription>
                  When on, candidates can find and submit to this production.
                  When off, all audition pages for this production are hidden.
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

        <div className="flex flex-col gap-group pt-block">
          <div className="flex flex-col gap-element">
            <div className="flex items-center gap-element">
              <p className="font-medium text-foreground text-label">
                Audition page
              </p>
              {!watched.isOpen && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-caption text-muted-foreground">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-caption text-muted-foreground">
              {watched.isOpen
                ? "Share this link with candidates so they can find all the roles in this production. Post it on social media, your website, or in audition notices."
                : "Open submissions to share this link."}
            </p>
          </div>

          <div className="flex items-center gap-element rounded-md border bg-muted px-group py-element">
            <p
              className={cn(
                "flex-1 break-all font-mono text-caption",
                watched.isOpen
                  ? "text-foreground"
                  : "text-muted-foreground line-through",
              )}
            >
              {getAppUrl(`/s/${orgSlug}/${currentSlug}`)}
            </p>
            <div
              className={cn(
                "flex items-center gap-element",
                !watched.isOpen && "pointer-events-none invisible",
              )}
            >
              <CopyButton value={getAppUrl(`/s/${orgSlug}/${currentSlug}`)} />
              <Button
                href={`/s/${orgSlug}/${currentSlug}`}
                variant="ghost"
                size="sm"
                leftSection={<LinkIcon />}
              >
                View page
              </Button>
            </div>
          </div>
        </div>

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex justify-center">
          <Button
            type="submit"
            loading={action.isPending}
            disabled={!hasChanges}
          >
            Save
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
