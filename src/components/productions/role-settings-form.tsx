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
import { Label } from "@/components/common/label"
import { RadioGroup, RadioGroupItem } from "@/components/common/radio-group"
import { RichTextEditor } from "@/components/common/rich-text-editor"
import { formResolver } from "@/lib/schemas/resolve"
import { updateRoleFormSchema } from "@/lib/schemas/role"

interface Props {
  roleId: string
  currentName: string
  currentDescription: string
  currentStatus: "open" | "closed" | "archive"
}

export function RoleSettingsForm({
  roleId,
  currentName,
  currentDescription,
  currentStatus,
}: Props) {
  const router = useRouter()
  const { form, action } = useHookFormAction(
    updateRole,
    formResolver(updateRoleFormSchema),
    {
      formProps: {
        defaultValues: {
          name: currentName,
          status: currentStatus,
          description: currentDescription,
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
    watched.status !== currentStatus ||
    watched.description !== currentDescription

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
                    <FieldDescription>
                      No longer in use. Data is kept but this role won't appear
                      anywhere.
                    </FieldDescription>
                  </FieldContent>
                </Label>
              </RadioGroup>
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>
                Description (optional)
              </FieldLabel>
              <RichTextEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                id={field.name}
                aria-invalid={fieldState.invalid}
              />
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
