"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { createOrganization } from "@/actions/organizations/create-organization"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required."),
})

export function CreateOrgForm() {
  const router = useRouter()
  const form = useForm<z.infer<typeof createOrgSchema>>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "" },
  })

  const { execute, isPending } = useAction(createOrganization, {
    onSuccess() {
      router.refresh()
      router.push("/home")
    },
    onError({ error }) {
      form.setError("root", {
        message:
          error.serverError ??
          "We couldn't create the organization. Try again.",
      })
    },
  })

  return (
    <form onSubmit={form.handleSubmit((v) => execute(v))}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Organization name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                placeholder="e.g. Riverside Community Theatre"
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
          Create organization
        </Button>
      </FieldGroup>
    </form>
  )
}
