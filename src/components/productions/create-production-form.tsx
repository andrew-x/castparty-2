"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { PlusIcon, TrashIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useRef, useState } from "react"
import { Controller, useFieldArray } from "react-hook-form"
import type { z } from "zod/v4"
import { checkSlugAvailability } from "@/actions/productions/check-slug"
import { createProduction } from "@/actions/productions/create-production"
import { Alert, AlertDescription } from "@/components/common/alert"
import { AutocompleteInput } from "@/components/common/autocomplete-input"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { RichTextEditor } from "@/components/common/rich-text-editor"
import {
  type StageData,
  StagesEditor,
} from "@/components/productions/default-stages-editor"
import { useCityOptions } from "@/hooks/use-city-options"
import { createProductionFormSchema } from "@/lib/schemas/production"
import { formResolver } from "@/lib/schemas/resolve"
import { slugify } from "@/lib/slugify"
import { getAppUrl } from "@/lib/url"

type FormValues = z.infer<typeof createProductionFormSchema>

type Step = "details" | "stages" | "roles"

const STEPS = ["details", "stages", "roles"] as const

const DEFAULT_CUSTOM_STAGES: StageData[] = [
  { id: "tmp-screening", name: "Screening", order: 1, type: "CUSTOM" },
  { id: "tmp-audition", name: "Audition", order: 2, type: "CUSTOM" },
  { id: "tmp-callback", name: "Callback", order: 3, type: "CUSTOM" },
]

const SYSTEM_STAGES: StageData[] = [
  { id: "sys-applied", name: "Applied", order: 0, type: "APPLIED" },
  { id: "sys-selected", name: "Selected", order: 1000, type: "SELECTED" },
  { id: "sys-rejected", name: "Rejected", order: 1001, type: "REJECTED" },
]

let tempIdCounter = 0
function nextTempId() {
  return `tmp-${++tempIdCounter}`
}

export function CreateProductionForm({ orgSlug }: { orgSlug: string }) {
  const router = useRouter()
  const cityOptions = useCityOptions()
  const [step, setStep] = useState<Step>("details")
  const [customStages, setCustomStages] = useState<StageData[]>(
    DEFAULT_CUSTOM_STAGES,
  )
  const slugTouchedRef = useRef(false)

  const { form, action } = useHookFormAction(
    createProduction,
    formResolver(createProductionFormSchema),
    {
      formProps: {
        defaultValues: {
          name: "",
          description: "",
          location: "",
          slug: "",
          roles: [],
        },
      },
      actionProps: {
        onSuccess({ data }) {
          if (data?.id) {
            router.push(`/productions/${data.id}`)
          }
        },
        onError({ error }) {
          form.setError("root", {
            message:
              error.serverError ??
              "We couldn't create the production. Try again.",
          })
        },
      },
    },
  )

  const { executeAsync: executeSlugCheck, isPending: isCheckingSlug } =
    useAction(checkSlugAvailability)

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "roles",
  })

  // Auto-fill slug from name while user hasn't manually edited it
  const nameValue = form.watch("name")
  useEffect(() => {
    if (!slugTouchedRef.current) {
      form.setValue("slug", slugify(nameValue))
    }
  }, [nameValue, form])

  async function handleNextToStages() {
    const valid = await form.trigger([
      "name",
      "description",
      "location",
      "slug",
    ])
    if (!valid) return

    const slugValue = form.getValues("slug")
    if (slugValue) {
      const result = await executeSlugCheck({ slug: slugValue })
      if (result?.data && !result.data.available) {
        form.setError("slug", { message: "This URL ID is already taken." })
        return
      }
    }

    setStep("stages")
  }

  function handleNextToRoles() {
    setStep("roles")
  }

  function handleBackToDetails() {
    setStep("details")
  }

  function handleBackToStages() {
    setStep("stages")
  }

  function handleSlugChange(value: string) {
    if (value === "") {
      // User cleared the slug, resume auto-filling
      slugTouchedRef.current = false
      form.setValue("slug", slugify(nameValue))
    } else {
      slugTouchedRef.current = true
      form.setValue("slug", value)
    }
  }

  // --- Stages callbacks ---
  function handleAddStage(name: string) {
    const maxOrder = Math.max(0, ...customStages.map((s) => s.order))
    setCustomStages((prev) => [
      ...prev,
      { id: nextTempId(), name, order: maxOrder + 1, type: "CUSTOM" },
    ])
  }

  function handleRemoveStage(id: string) {
    setCustomStages((prev) => prev.filter((s) => s.id !== id))
  }

  function handleReorderStages(reordered: StageData[]) {
    setCustomStages(reordered.filter((s) => s.type === "CUSTOM"))
  }

  // Accepts the action schema's broader type (roles optional) since useHookFormAction
  // types the submit handler against the action input, not the form schema.
  function handleSubmit(
    values: { name: string; roles?: FormValues["roles"] } & Partial<FormValues>,
  ) {
    const roles = (values.roles ?? []).filter((r) => r.name.trim().length > 0)
    const slug = values.slug?.trim() || undefined
    const stageNames = customStages.map((s) => s.name)

    action.execute({
      name: values.name,
      description: values.description || undefined,
      location: values.location || undefined,
      slug,
      customStages: stageNames,
      roles: roles.length > 0 ? roles : undefined,
    })
  }

  const allStages: StageData[] = [
    SYSTEM_STAGES[0],
    ...customStages,
    SYSTEM_STAGES[1],
    SYSTEM_STAGES[2],
  ]

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <p className="text-caption text-muted-foreground">
        Step {STEPS.indexOf(step) + 1} of {STEPS.length}
      </p>

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
                <RichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  id={field.name}
                  placeholder="A brief description of the production"
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
                <FieldLabel htmlFor={field.name}>
                  Location (optional)
                </FieldLabel>
                <AutocompleteInput
                  id={field.name}
                  value={field.value ?? ""}
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
            render={({ field, fieldState }) => {
              const previewSlug = field.value || "your-production"
              const previewUrl = getAppUrl(`/s/${orgSlug}/${previewSlug}`)

              return (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>
                    URL slug (optional)
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="e.g. our-town"
                    aria-invalid={fieldState.invalid}
                    onChange={(e) => handleSlugChange(e.target.value)}
                  />
                  <p className="text-caption text-muted-foreground">
                    Your audition page will be at{" "}
                    <strong className="break-all">{previewUrl}</strong>
                  </p>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )
            }}
          />
          <div className="flex justify-end gap-element">
            <Button type="button" variant="outline" href="/productions">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleNextToStages}
              loading={isCheckingSlug}
            >
              Continue
            </Button>
          </div>
        </FieldGroup>
      )}

      {step === "stages" && (
        <FieldGroup>
          <div className="flex flex-col gap-block">
            <div>
              <h2 className="font-medium text-heading">Casting pipeline</h2>
              <p className="text-caption text-muted-foreground">
                Define the steps candidates move through during your casting
                process. You can customize these later, or set up different
                stages per role.
              </p>
            </div>

            <StagesEditor
              stages={allStages}
              onAdd={handleAddStage}
              onRemove={handleRemoveStage}
              onReorder={handleReorderStages}
            />
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToDetails}
            >
              Back
            </Button>
            <Button type="button" onClick={handleNextToRoles}>
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
                leftSection={<PlusIcon />}
                onClick={() => append({ name: "", description: "" })}
              >
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
                    tooltip="Remove role"
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
                      <RichTextEditor
                        value={f.value ?? ""}
                        onChange={f.onChange}
                        id={f.name}
                        placeholder="Brief description of this role"
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
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToStages}
            >
              Back
            </Button>
            <Button type="submit" loading={action.isPending}>
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
