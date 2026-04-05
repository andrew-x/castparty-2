"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRef } from "react"
import { Controller } from "react-hook-form"
import { bulkSendEmailAction } from "@/actions/submissions/bulk-send-email"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { Textarea } from "@/components/common/textarea"
import { HighlightedText } from "@/components/productions/highlighted-text"
import { VariableInsertButtons } from "@/components/productions/variable-insert-buttons"
import { bulkEmailFormSchema } from "@/lib/schemas/bulk-email"
import { formResolver } from "@/lib/schemas/resolve"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  submissionIds: string[]
  onSuccess: () => void
}

export function BulkEmailDialog({
  open,
  onOpenChange,
  submissionIds,
  onSuccess,
}: Props) {
  const subjectRef = useRef<HTMLInputElement | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

  const { form, action } = useHookFormAction(
    bulkSendEmailAction,
    formResolver(bulkEmailFormSchema),
    {
      formProps: { defaultValues: { subject: "", body: "" } },
      actionProps: {
        onSuccess() {
          close()
          onSuccess()
        },
        onError({ error }) {
          form.setError("root", {
            message: error.serverError ?? "Something went wrong. Try again.",
          })
        },
      },
    },
  )

  function close() {
    form.reset({ subject: "", body: "" })
    onOpenChange(false)
  }

  function onSubmit(values: { subject: string; body: string }) {
    action.execute({ ...values, submissionIds })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send email</DialogTitle>
          <DialogDescription>
            Sending to {submissionIds.length}{" "}
            {submissionIds.length === 1 ? "candidate" : "candidates"}. Use
            template tokens to personalize each email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="subject"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Subject</FieldLabel>
                  <div className="relative">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre rounded-md border border-transparent px-3 py-2 text-sm text-transparent"
                    >
                      <HighlightedText text={field.value ?? ""} />
                    </div>
                    <Input
                      {...field}
                      ref={(el) => {
                        field.ref(el)
                        subjectRef.current = el
                      }}
                      id={field.name}
                      type="text"
                      placeholder="Email subject..."
                      aria-invalid={fieldState.invalid}
                      className="bg-transparent"
                    />
                  </div>
                  <VariableInsertButtons
                    inputRef={subjectRef}
                    onInsert={field.onChange}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="body"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Body</FieldLabel>
                  <div className="relative">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-md border border-transparent px-3 py-2 text-sm text-transparent"
                    >
                      <HighlightedText text={field.value ?? ""} />
                    </div>
                    <Textarea
                      {...field}
                      ref={(el) => {
                        field.ref(el)
                        bodyRef.current = el
                      }}
                      id={field.name}
                      rows={8}
                      placeholder="Write your email..."
                      aria-invalid={fieldState.invalid}
                      className="bg-transparent"
                    />
                  </div>
                  <VariableInsertButtons
                    inputRef={bodyRef}
                    onInsert={field.onChange}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
          </FieldGroup>

          <DialogFooter className="mt-group">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={action.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={action.isPending}>
              Send to {submissionIds.length}{" "}
              {submissionIds.length === 1 ? "candidate" : "candidates"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
