"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { Controller } from "react-hook-form"
import { simulateInboundEmailAction } from "@/actions/admin/simulate-inbound-email"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { Textarea } from "@/components/common/textarea"
import { formResolver } from "@/lib/schemas/resolve"
import { simulateInboundEmailFormSchema } from "@/lib/schemas/simulate-inbound-email"

const defaultValues = {
  toEmail: "",
  fromEmail: "",
  subject: "",
  bodyText: "",
}

export function SimulateEmailClient() {
  const { form, action } = useHookFormAction(
    simulateInboundEmailAction,
    formResolver(simulateInboundEmailFormSchema),
    {
      formProps: { defaultValues },
      actionProps: {
        onSuccess() {
          form.reset(defaultValues)
        },
        onError({ error }) {
          form.setError("root", {
            message: error.serverError ?? "Something went wrong.",
          })
        },
      },
    },
  )

  return (
    <div className="flex flex-col gap-section">
      <div>
        <h2 className="font-serif text-foreground text-heading">
          Simulate inbound email
        </h2>
        <p className="mt-element text-body text-muted-foreground">
          Create an inbound email record as if a candidate replied. The email
          will appear in the submission's activity log.
        </p>
      </div>
      <form
        onSubmit={form.handleSubmit((v) => action.execute(v))}
        className="flex max-w-lg flex-col gap-block"
      >
        <FieldGroup>
          <Controller
            name="toEmail"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>To (reply address)</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="reply+sub-...@inbound.joincastparty.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="fromEmail"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>From email</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="candidate@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="subject"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Subject</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Re: Your submission for..."
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="bodyText"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Body</FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  rows={5}
                  placeholder="Write the email body..."
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          {action.hasSucceeded && (
            <Alert>
              <AlertDescription>
                Inbound email created. Check the submission's activity log.
              </AlertDescription>
            </Alert>
          )}
          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}
        </FieldGroup>
        <Button type="submit" loading={action.isPending} className="self-start">
          Simulate inbound email
        </Button>
      </form>
    </div>
  )
}
