"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { Controller, type UseFormReturn } from "react-hook-form"
import { updateEmailTemplates } from "@/actions/productions/update-email-templates"
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
import { VariableInsertButtons } from "@/components/productions/variable-insert-buttons"
import {
  DEFAULT_EMAIL_TEMPLATES,
  TEMPLATE_VARIABLES,
} from "@/lib/email-template"
import {
  type UpdateEmailTemplatesInput,
  updateEmailTemplatesFormSchema,
} from "@/lib/schemas/email-template"
import { formResolver } from "@/lib/schemas/resolve"
import type { EmailTemplates } from "@/lib/types"
import { cn } from "@/lib/util"

interface Props {
  production: {
    id: string
    emailTemplates: EmailTemplates
  }
}

type TemplateKey = keyof EmailTemplates

interface TemplateConfig {
  key: TemplateKey
  label: string
  description: string
}

const TEMPLATES: TemplateConfig[] = [
  {
    key: "submissionReceived",
    label: "Submission Received",
    description:
      "Sent automatically when a candidate submits for a role in this production.",
  },
  {
    key: "rejected",
    label: "Rejected",
    description:
      "Sent when you reject a submission. You'll see a preview before it sends.",
  },
  {
    key: "selected",
    label: "Selected",
    description:
      "Sent when you select a candidate for a role. You'll see a preview before it sends.",
  },
]

const validVariableSet = new Set<string>(TEMPLATE_VARIABLES)

/** Renders text with valid {{variables}} highlighted. */
function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(\{\{[\w]*\}\})/g)
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{(\w*)\}\}$/)
        if (match && validVariableSet.has(match[1])) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: static split, no reordering
            <mark key={i} className="rounded-sm bg-brand/15 text-brand">
              {part}
            </mark>
          )
        }
        // biome-ignore lint/suspicious/noArrayIndexKey: static split, no reordering
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export function EmailTemplatesForm({ production }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedKey =
    (searchParams.get("template") as TemplateKey | null) ?? "submissionReceived"
  const selected = TEMPLATES.find((t) => t.key === selectedKey) ?? TEMPLATES[0]

  function handleTemplateClick(key: TemplateKey) {
    router.replace(`?template=${key}`, { scroll: false })
  }

  const { form, action } = useHookFormAction(
    updateEmailTemplates,
    formResolver(updateEmailTemplatesFormSchema),
    {
      formProps: {
        defaultValues: {
          productionId: production.id,
          emailTemplates: production.emailTemplates,
        },
      },
      actionProps: {
        onSuccess() {
          router.refresh()
        },
        onError({ error }) {
          form.setError("root", {
            message:
              error.serverError ??
              "We couldn't save the email templates. Try again.",
          })
        },
      },
    },
  )

  return (
    <form
      onSubmit={form.handleSubmit((v) => action.execute(v))}
      className="flex min-h-0 flex-1"
    >
      {/* Left panel — template list */}
      <div className="flex w-64 shrink-0 flex-col border-r">
        <div className="flex items-center border-b px-4 py-3">
          <h2 className="font-medium text-label">Email Templates</h2>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {TEMPLATES.map((template) => {
            const isActive = selected.key === template.key
            return (
              <button
                key={template.key}
                type="button"
                onClick={() => handleTemplateClick(template.key)}
                className={cn(
                  "flex w-full items-center border-l-2 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  isActive
                    ? "border-l-brand bg-muted/50"
                    : "border-l-transparent",
                )}
              >
                <span className="min-w-0 truncate font-medium text-label">
                  {template.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Right panel — template editor */}
      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        <p className="mb-group text-label text-muted-foreground">
          {selected.description}
        </p>
        <TemplateEditor
          key={selected.key}
          templateKey={selected.key}
          form={form}
        />

        {form.formState.errors.root && (
          <Alert variant="destructive" className="mt-group">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-group flex gap-element">
          <Button type="submit" loading={action.isPending}>
            Save templates
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const defaults = DEFAULT_EMAIL_TEMPLATES[selected.key]
              form.setValue(
                `emailTemplates.${selected.key}.subject`,
                defaults.subject,
                { shouldDirty: true },
              )
              form.setValue(
                `emailTemplates.${selected.key}.body`,
                defaults.body,
                { shouldDirty: true },
              )
            }}
          >
            Reset to default
          </Button>
        </div>
      </div>
    </form>
  )
}

function TemplateEditor({
  templateKey,
  form,
}: {
  templateKey: TemplateKey
  form: UseFormReturn<UpdateEmailTemplatesInput>
}) {
  const subjectRef = useRef<HTMLInputElement | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

  const subjectName = `emailTemplates.${templateKey}.subject` as const
  const bodyName = `emailTemplates.${templateKey}.body` as const

  return (
    <FieldGroup>
      <Controller
        name={subjectName}
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
                aria-invalid={fieldState.invalid}
                className="bg-transparent"
              />
            </div>
            <VariableInsertButtons
              inputRef={subjectRef}
              onInsert={field.onChange}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={bodyName}
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
                aria-invalid={fieldState.invalid}
                className="bg-transparent"
              />
            </div>
            <VariableInsertButtons
              inputRef={bodyRef}
              onInsert={field.onChange}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  )
}
