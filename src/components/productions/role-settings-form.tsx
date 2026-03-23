"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { updateRole } from "@/actions/productions/update-role"
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
import { Textarea } from "@/components/common/textarea"
import { formResolver } from "@/lib/schemas/resolve"
import { updateRoleFormSchema } from "@/lib/schemas/role"
import { getAppUrl } from "@/lib/url"

interface Props {
  roleId: string
  orgSlug: string
  productionSlug: string
  currentName: string
  currentSlug: string
  currentDescription: string
  currentIsOpen: boolean
  currentIsArchived: boolean
}

export function RoleSettingsForm({
  roleId,
  orgSlug,
  productionSlug,
  currentName,
  currentSlug,
  currentDescription,
  currentIsOpen,
  currentIsArchived,
}: Props) {
  const router = useRouter()
  const { form, action } = useHookFormAction(
    updateRole,
    formResolver(updateRoleFormSchema),
    {
      formProps: {
        defaultValues: {
          name: currentName,
          description: currentDescription,
          slug: currentSlug,
          isOpen: currentIsOpen,
          isArchived: currentIsArchived,
        },
      },
      actionProps: {
        onSuccess() {
          router.refresh()
        },
        onError({ error }) {
          form.setError("root", {
            message:
              error.serverError ?? "We couldn't update the role. Try again.",
          })
        },
      },
    },
  )

  const watched = form.watch()
  const hasChanges =
    watched.name !== currentName ||
    watched.description !== currentDescription ||
    watched.slug !== currentSlug ||
    watched.isOpen !== currentIsOpen ||
    watched.isArchived !== currentIsArchived

  const auditionUrl = getAppUrl(
    `/s/${orgSlug}/${productionSlug}/${watched.slug || currentSlug}`,
  )

  return (
    <form onSubmit={form.handleSubmit((v) => action.execute({ ...v, roleId }))}>
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
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>URL slug</FieldLabel>
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

        <Controller
          name="isOpen"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Open for auditions</FieldTitle>
                <FieldDescription>
                  When on, candidates can find and audition for this role. When
                  off, the audition page for this role is hidden.
                </FieldDescription>
              </FieldContent>
              <Switch
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={watched.isArchived}
              />
            </Field>
          )}
        />

        <Controller
          name="isArchived"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Archive role</FieldTitle>
                <FieldDescription>
                  Archived roles are hidden from the role list. Archiving
                  automatically closes auditions for this role.
                </FieldDescription>
              </FieldContent>
              <Switch
                id={field.name}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked)
                  if (checked) form.setValue("isOpen", false)
                }}
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
