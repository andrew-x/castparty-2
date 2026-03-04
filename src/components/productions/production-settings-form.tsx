"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { LinkIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { toggleProductionOpen } from "@/actions/productions/toggle-production-open"
import { updateProduction } from "@/actions/productions/update-production"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import { CopyButton } from "@/components/common/copy-button"
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
import { Switch } from "@/components/common/switch"
import { getAppUrl } from "@/lib/url"
import { cn } from "@/lib/util"

const schema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
  slug: z
    .string()
    .trim()
    .min(3, "URL ID must be at least 3 characters.")
    .max(60, "URL ID must be at most 60 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers, and hyphens only.",
    ),
})

interface Props {
  productionId: string
  orgSlug: string
  currentName: string
  currentSlug: string
  isOpen: boolean
}

export function ProductionSettingsForm({
  productionId,
  orgSlug,
  currentName,
  currentSlug,
  isOpen,
}: Props) {
  const router = useRouter()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: currentName, slug: currentSlug },
  })

  const { execute, isPending } = useAction(updateProduction, {
    onSuccess() {
      router.refresh()
    },
    onError({ error }) {
      form.setError("root", {
        message:
          error.serverError ?? "We couldn't update the production. Try again.",
      })
    },
  })

  const [open, setOpen] = useState(isOpen)

  const { execute: executeToggle, isPending: isToggling } = useAction(
    toggleProductionOpen,
    {
      onError() {
        setOpen((prev) => !prev)
      },
    },
  )

  function handleToggle(checked: boolean) {
    setOpen(checked)
    executeToggle({ productionId, isOpen: checked })
  }

  const watched = form.watch()
  const hasChanges =
    watched.name !== currentName || watched.slug !== currentSlug

  const auditionUrl = getAppUrl(`/s/${orgSlug}/${watched.slug || currentSlug}`)

  return (
    <>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Accepting submissions</FieldTitle>
          <FieldDescription>
            When on, candidates can find and submit to this production. When
            off, all audition pages for this production are hidden.
          </FieldDescription>
        </FieldContent>
        <Switch
          checked={open}
          onCheckedChange={handleToggle}
          disabled={isToggling}
          aria-label="Toggle accepting submissions"
        />
      </Field>

      <form
        onSubmit={form.handleSubmit((v) =>
          execute({ productionId, name: v.name, slug: v.slug }),
        )}
      >
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
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>URL ID</FieldLabel>
                <p className="text-caption text-muted-foreground">
                  This controls the URL for your production's audition page.
                </p>
                <Input
                  {...field}
                  id={field.name}
                  type="text"
                  aria-invalid={fieldState.invalid}
                />
                <p className="text-caption text-muted-foreground">
                  Preview: <strong>{auditionUrl}</strong>
                </p>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <div className="flex flex-col gap-group pt-block">
            <div className="flex flex-col gap-element">
              <div className="flex items-center gap-element">
                <p className="font-medium text-foreground text-label">
                  Audition page
                </p>
                {!open && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-caption text-muted-foreground">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-caption text-muted-foreground">
                {open
                  ? "Share this link with candidates so they can find all the roles in this production. Post it on social media, your website, or in audition notices."
                  : "Open submissions to share this link."}
              </p>
            </div>

            <div className="flex items-center gap-element rounded-md border bg-muted px-group py-element">
              <p
                className={cn(
                  "flex-1 break-all font-mono text-caption",
                  open
                    ? "text-foreground"
                    : "text-muted-foreground line-through",
                )}
              >
                {getAppUrl(`/s/${orgSlug}/${currentSlug}`)}
              </p>
              <div
                className={cn(
                  "flex items-center gap-element",
                  !open && "pointer-events-none invisible",
                )}
              >
                <CopyButton value={getAppUrl(`/s/${orgSlug}/${currentSlug}`)} />
                <Button
                  href={`/s/${orgSlug}/${currentSlug}`}
                  variant="ghost"
                  size="sm"
                  leftSection={<LinkIcon />}
                >
                  View page
                </Button>
              </div>
            </div>
          </div>

          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            variant="outline"
            size="sm"
            loading={isPending}
            disabled={!hasChanges}
          >
            Save
          </Button>
        </FieldGroup>
      </form>
    </>
  )
}
