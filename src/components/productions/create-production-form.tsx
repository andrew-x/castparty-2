"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, TrashIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { createProduction } from "@/actions/productions/create-production"
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

const schema = z.object({
  name: z.string().min(1, "Production name is required.").max(100),
  description: z.string().optional(),
  roles: z.array(
    z.object({
      name: z.string().min(1, "Role name is required.").max(100),
      description: z.string().optional(),
    }),
  ),
})

type FormValues = z.infer<typeof schema>

export function CreateProductionForm() {
  const router = useRouter()
  const [step, setStep] = useState<"details" | "roles">("details")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", roles: [] },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "roles",
  })

  const { execute, isPending } = useAction(createProduction, {
    onSuccess({ data }) {
      if (data?.id) {
        router.push(`/productions/${data.id}`)
      }
    },
    onError({ error }) {
      form.setError("root", {
        message:
          error.serverError ?? "We couldn't create the production. Try again.",
      })
    },
  })

  async function handleNext() {
    const valid = await form.trigger(["name", "description"])
    if (valid) {
      setStep("roles")
    }
  }

  function handleBack() {
    setStep("details")
  }

  function handleSubmit(values: FormValues) {
    const roles = values.roles.filter((r) => r.name.trim().length > 0)
    execute({
      name: values.name,
      description: values.description || undefined,
      roles: roles.length > 0 ? roles : undefined,
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {step === "details" && (
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
                  placeholder="e.g. Our Town"
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
                <FieldLabel htmlFor={field.name}>
                  Description (optional)
                </FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  placeholder="A brief description of the production"
                  rows={3}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <div className="flex justify-end gap-element">
            <Button type="button" variant="outline" asChild>
              <a href="/productions">Cancel</a>
            </Button>
            <Button type="button" onClick={handleNext}>
              Continue
            </Button>
          </div>
        </FieldGroup>
      )}

      {step === "roles" && (
        <FieldGroup>
          <div className="flex flex-col gap-block">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium text-heading">Roles</h2>
                <p className="text-caption text-muted-foreground">
                  Add the roles you're casting for. You can skip this and add
                  them later.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", description: "" })}
              >
                <PlusIcon className="size-4" />
                Add role
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="py-group text-center text-caption text-muted-foreground">
                No roles added yet.
              </p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-element rounded-lg border p-group"
              >
                <div className="flex items-start justify-between gap-element">
                  <Controller
                    name={`roles.${index}.name`}
                    control={form.control}
                    render={({ field: f, fieldState }) => (
                      <Field
                        className="flex-1"
                        data-invalid={fieldState.invalid || undefined}
                      >
                        <FieldLabel htmlFor={f.name}>Role name</FieldLabel>
                        <Input
                          {...f}
                          id={f.name}
                          type="text"
                          placeholder="e.g. Stage Manager"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6 shrink-0"
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="size-4" />
                    <span className="sr-only">Remove role</span>
                  </Button>
                </div>
                <Controller
                  name={`roles.${index}.description`}
                  control={form.control}
                  render={({ field: f, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor={f.name}>
                        Description (optional)
                      </FieldLabel>
                      <Textarea
                        {...f}
                        id={f.name}
                        placeholder="Brief description of this role"
                        rows={2}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            ))}
          </div>

          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button type="submit" loading={isPending}>
              {fields.length > 0
                ? "Create production with roles"
                : "Create production"}
            </Button>
          </div>
        </FieldGroup>
      )}
    </form>
  )
}
