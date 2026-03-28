"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { updateProduction } from "@/actions/productions/update-production"
import { Alert, AlertDescription } from "@/components/common/alert"
import { AutocompleteInput } from "@/components/common/autocomplete-input"
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
import { Label } from "@/components/common/label"
import { RadioGroup, RadioGroupItem } from "@/components/common/radio-group"
import { useCityOptions } from "@/hooks/use-city-options"
import { updateProductionFormSchema } from "@/lib/schemas/production"
import { formResolver } from "@/lib/schemas/resolve"
import { getAppUrl } from "@/lib/url"

interface Props {
  productionId: string
  orgSlug: string
  currentName: string
  currentLocation: string
  currentSlug: string
  status: "open" | "closed" | "archive"
}

export function ProductionSettingsForm({
  productionId,
  orgSlug,
  currentName,
  currentLocation,
  currentSlug,
  status,
}: Props) {
  const router = useRouter()
  const cityOptions = useCityOptions()
  const { form, action } = useHookFormAction(
    updateProduction,
    formResolver(updateProductionFormSchema),
    {
      formProps: {
        defaultValues: {
          name: currentName,
          location: currentLocation,
          slug: currentSlug,
          status,
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
              "We couldn't update the production. Try again.",
          })
        },
      },
    },
  )

  const watched = form.watch()
  const hasChanges =
    watched.name !== currentName ||
    watched.location !== currentLocation ||
    watched.slug !== currentSlug ||
    watched.status !== status

  const auditionUrl = getAppUrl(`/s/${orgSlug}/${watched.slug || currentSlug}`)

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        action.execute({
          productionId,
          name: v.name,
          location: v.location,
          slug: v.slug,
          status: v.status,
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
          name="location"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Location</FieldLabel>
              <AutocompleteInput
                id={field.name}
                value={field.value}
                onChange={field.onChange}
                options={cityOptions}
                placeholder="e.g. Toronto, ON"
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
          name="status"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Status</FieldLabel>
              <RadioGroup value={field.value} onValueChange={field.onChange}>
                <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-[[data-state=checked]]:border-border-brand">
                  <RadioGroupItem value="open" />
                  <FieldContent>
                    <FieldTitle>Open</FieldTitle>
                    <FieldDescription>
                      Accepting auditions. Publicly visible.
                    </FieldDescription>
                  </FieldContent>
                </Label>
                <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-[[data-state=checked]]:border-border-brand">
                  <RadioGroupItem value="closed" />
                  <FieldContent>
                    <FieldTitle>Closed</FieldTitle>
                    <FieldDescription>
                      Not accepting auditions. Visible to your team.
                    </FieldDescription>
                  </FieldContent>
                </Label>
                <Label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-[[data-state=checked]]:border-border-brand">
                  <RadioGroupItem value="archive" />
                  <FieldContent>
                    <FieldTitle>Archived</FieldTitle>
                    <FieldDescription>Hidden from all lists.</FieldDescription>
                  </FieldContent>
                </Label>
              </RadioGroup>
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
