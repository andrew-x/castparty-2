"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog"
import { Field, FieldLabel } from "@/components/common/field"
import { Input } from "@/components/common/input"
import { Textarea } from "@/components/common/textarea"

interface FormValues {
  subject: string
  body: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSubject: string
  initialBody: string
  actionLabel: string
  onConfirm: (sendEmail: boolean, subject: string, body: string) => void
}

export function EmailPreviewDialog({
  open,
  onOpenChange,
  initialSubject,
  initialBody,
  actionLabel,
  onConfirm,
}: Props) {
  const form = useForm<FormValues>({
    defaultValues: { subject: initialSubject, body: initialBody },
  })

  // Reset form when dialog opens with new values
  useEffect(() => {
    if (open) {
      form.reset({ subject: initialSubject, body: initialBody })
    }
  }, [open, initialSubject, initialBody, form])

  function handleConfirm(sendEmail: boolean) {
    const { subject, body } = form.getValues()
    onConfirm(sendEmail, subject, body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{actionLabel} Candidate</DialogTitle>
          <DialogDescription>
            You can edit the email before sending, or skip sending entirely.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-group">
          <Controller
            name="subject"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Subject</FieldLabel>
                <Input {...field} id={field.name} />
              </Field>
            )}
          />
          <Controller
            name="body"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Body</FieldLabel>
                <Textarea {...field} id={field.name} rows={8} />
              </Field>
            )}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleConfirm(false)}
            tooltip={`${actionLabel} the candidate without sending them a notification email`}
          >
            {actionLabel} without email
          </Button>
          <Button
            onClick={() => handleConfirm(true)}
            tooltip={`${actionLabel} the candidate and send them the email above`}
          >
            {actionLabel} & send email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
