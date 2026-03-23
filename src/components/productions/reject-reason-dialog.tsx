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
import { Label } from "@/components/common/label"
import { RadioGroup, RadioGroupItem } from "@/components/common/radio-group"
import { Textarea } from "@/components/common/textarea"

const OTHER_VALUE = "__other__"

interface FormValues {
  reason: string
  customReason: string
  emailSubject: string
  emailBody: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  reasons: string[]
  /** When provided, the dialog shows an editable email section and dual-action footer. */
  emailPreview?: {
    subject: string
    body: string
  }
  onConfirm: (
    reason: string,
    sendEmail: boolean,
    emailSubject?: string,
    emailBody?: string,
  ) => void
}

export function RejectReasonDialog({
  open,
  onOpenChange,
  reasons,
  emailPreview,
  onConfirm,
}: Props) {
  const form = useForm<FormValues>({
    defaultValues: {
      reason: "",
      customReason: "",
      emailSubject: emailPreview?.subject ?? "",
      emailBody: emailPreview?.body ?? "",
    },
  })

  // Reset form when dialog opens with new values
  useEffect(() => {
    if (open) {
      form.reset({
        reason: "",
        customReason: "",
        emailSubject: emailPreview?.subject ?? "",
        emailBody: emailPreview?.body ?? "",
      })
    }
  }, [open, emailPreview?.subject, emailPreview?.body, form])

  const selectedReason = form.watch("reason")
  const customReason = form.watch("customReason")
  const isOther = selectedReason === OTHER_VALUE
  const resolvedReason = isOther ? customReason.trim() : selectedReason
  const canConfirm = resolvedReason.length > 0

  function handleConfirm(sendEmail: boolean) {
    if (!canConfirm) return
    const { emailSubject, emailBody } = form.getValues()
    onConfirm(resolvedReason, sendEmail, emailSubject, emailBody)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={emailPreview ? "sm:max-w-2xl" : undefined}>
        <DialogHeader>
          <DialogTitle>Reject Candidate</DialogTitle>
          <DialogDescription>
            {emailPreview
              ? "Select a reason and optionally send a notification email."
              : "Select a reason for rejecting this candidate."}
          </DialogDescription>
        </DialogHeader>

        <Controller
          name="reason"
          control={form.control}
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange}>
              {reasons.map((reason, index) => (
                <div key={reason} className="flex items-center gap-2">
                  <RadioGroupItem value={reason} id={`reason-${index}`} />
                  <Label htmlFor={`reason-${index}`} className="cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <RadioGroupItem value={OTHER_VALUE} id="reason-other" />
                <Label htmlFor="reason-other" className="cursor-pointer">
                  Other
                </Label>
              </div>
            </RadioGroup>
          )}
        />

        {isOther && (
          <Controller
            name="customReason"
            control={form.control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Enter a custom reason..."
                maxLength={500}
                autoFocus
              />
            )}
          />
        )}

        {emailPreview && (
          <div className="flex flex-col gap-group border-t pt-group">
            <p className="font-medium text-sm">Notification email</p>
            <Controller
              name="emailSubject"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Subject</FieldLabel>
                  <Input {...field} id={field.name} />
                </Field>
              )}
            />
            <Controller
              name="emailBody"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Body</FieldLabel>
                  <Textarea {...field} id={field.name} rows={6} />
                </Field>
              )}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {emailPreview ? (
            <>
              <Button
                variant="destructive"
                disabled={!canConfirm}
                onClick={() => handleConfirm(false)}
                tooltip="Reject the candidate without sending them a notification email"
              >
                Reject without email
              </Button>
              <Button
                variant="destructive"
                disabled={!canConfirm}
                onClick={() => handleConfirm(true)}
                tooltip="Reject the candidate and send them the email above"
              >
                Reject & send email
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              disabled={!canConfirm}
              onClick={() => handleConfirm(false)}
            >
              Reject
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
