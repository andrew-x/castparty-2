"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { inviteMember } from "@/actions/organizations/invite-member"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
})

interface Props {
  organizationId: string
  onContinue?: () => void
}

export function InviteTeamForm({ organizationId, onContinue }: Props) {
  const router = useRouter()
  const [sentEmails, setSentEmails] = useState<string[]>([])

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  })

  const { execute, isPending } = useAction(inviteMember, {
    onSuccess() {
      const email = form.getValues("email")
      setSentEmails((prev) => [...prev, email])
      form.reset()
    },
    onError({ error }) {
      form.setError("root", {
        message: error.serverError ?? "We couldn't send the invite. Try again.",
      })
    },
  })

  function handleContinue() {
    if (onContinue) {
      onContinue()
      return
    }
    router.refresh()
    router.push("/home")
  }

  return (
    <div className="flex flex-col gap-block">
      <form
        onSubmit={form.handleSubmit((v) =>
          execute({ ...v, organizationId, role: "member" }),
        )}
      >
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
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
          <Button type="submit" loading={isPending} className="w-full">
            Send invite
          </Button>
        </FieldGroup>
      </form>

      {sentEmails.length > 0 && (
        <ul className="flex flex-col gap-element">
          {sentEmails.map((email) => (
            <li
              key={email}
              className="flex items-center gap-element text-label text-muted-foreground"
            >
              <CheckIcon className="size-4 shrink-0 text-brand" />
              {email}
            </li>
          ))}
        </ul>
      )}

      <Button variant="ghost" onClick={handleContinue} className="w-full">
        {sentEmails.length > 0 ? "Continue" : "Skip for now"}
      </Button>
    </div>
  )
}
