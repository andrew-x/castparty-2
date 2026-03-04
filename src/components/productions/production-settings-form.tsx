"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { updateProduction } from "@/actions/productions/update-production"
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
import { Switch } from "@/components/common/switch"
import { updateProductionFormSchema } from "@/lib/schemas/production"
import { formResolver } from "@/lib/schemas/resolve"
import { getAppUrl } from "@/lib/url"

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
              <FieldLabel htmlFor={field.name}>URL slug</FieldLabel>
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
                <FieldTitle>Open for auditions</FieldTitle>
                <FieldDescription>
                  When on, candidates can find and audition for this production.
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
