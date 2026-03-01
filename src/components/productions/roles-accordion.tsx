"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ExternalLinkIcon,
  LinkIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { createRole } from "@/actions/productions/create-role"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/common/accordion"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { CopyButton } from "@/components/common/copy-button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { Separator } from "@/components/common/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/common/sheet"
import { Textarea } from "@/components/common/textarea"
import day from "@/lib/dayjs"
import { getAppUrl } from "@/lib/url"

const addRoleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim().optional(),
})

interface SubmissionWithCandidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  resumeUrl: string | null
  createdAt: Date | string
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
}

interface RoleWithSubmissions {
  id: string
  name: string
  description: string | null
  submissions: SubmissionWithCandidate[]
}

interface Props {
  orgId: string
  productionId: string
  initialRoles: RoleWithSubmissions[]
}

export function RolesAccordion({ orgId, productionId, initialRoles }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithCandidate | null>(null)

  const form = useForm<z.infer<typeof addRoleSchema>>({
    resolver: zodResolver(addRoleSchema),
    defaultValues: { name: "", description: "" },
  })

  const { execute, isPending } = useAction(createRole, {
    onSuccess() {
      form.reset()
      setShowForm(false)
      router.refresh()
    },
    onError({ error }) {
      form.setError("root", {
        message: error.serverError ?? "We couldn't add the role. Try again.",
      })
    },
  })

  return (
    <div className="flex flex-col gap-block">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-heading">Roles</h2>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            leftSection={<PlusIcon />}
            onClick={() => setShowForm(true)}
          >
            Add role
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={form.handleSubmit((v) => execute({ ...v, productionId }))}
          className="rounded-lg border p-group"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Role name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
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
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-element">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  form.reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Add role
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}

      {initialRoles.length === 0 && !showForm && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserIcon />
            </EmptyMedia>
            <EmptyTitle>No roles yet</EmptyTitle>
            <EmptyDescription>
              Add the roles you're casting for to start receiving auditions.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              leftSection={<PlusIcon />}
              onClick={() => setShowForm(true)}
            >
              Add role
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {initialRoles.length > 0 && (
        <Accordion type="multiple">
          {initialRoles.map((role) => (
            <AccordionItem key={role.id} value={role.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-element">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <UserIcon className="size-4 text-foreground" />
                  </div>
                  <span className="font-medium text-foreground text-label">
                    {role.name}
                  </span>
                  <Badge variant="secondary">{role.submissions.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {role.description && (
                  <p className="mb-2 text-caption text-muted-foreground">
                    {role.description}
                  </p>
                )}
                <div className="mb-2 flex flex-col gap-element rounded-lg border p-group">
                  <p className="text-caption text-muted-foreground">
                    Role audition link
                  </p>
                  <div className="flex items-center gap-element">
                    <p className="break-all font-mono text-caption text-foreground">
                      /submit/{orgId}/{productionId}/{role.id}
                    </p>
                    <CopyButton
                      value={getAppUrl(
                        `/submit/${orgId}/${productionId}/${role.id}`,
                      )}
                    />
                  </div>
                  <Button
                    href={`/submit/${orgId}/${productionId}/${role.id}`}
                    variant="outline"
                    size="sm"
                    leftSection={<LinkIcon />}
                    className="w-fit"
                  >
                    View audition page
                  </Button>
                </div>
                {role.submissions.length === 0 ? (
                  <p className="text-caption text-muted-foreground">
                    No submissions yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-element">
                    {role.submissions.map((submission) => (
                      <Button
                        key={submission.id}
                        variant="ghost"
                        onClick={() => setSelectedSubmission(submission)}
                        className="h-auto w-full justify-between p-2 text-left"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground text-label">
                            {submission.firstName} {submission.lastName}
                          </span>
                          <span className="text-caption text-muted-foreground">
                            {submission.email}
                          </span>
                        </div>
                        <span className="text-caption text-muted-foreground">
                          {day(submission.createdAt).format("LL")}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Sheet
        open={!!selectedSubmission}
        onOpenChange={(open) => {
          if (!open) setSelectedSubmission(null)
        }}
      >
        <SheetContent>
          {selectedSubmission && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selectedSubmission.firstName} {selectedSubmission.lastName}
                </SheetTitle>
                <SheetDescription>Submission details</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-group px-4">
                <div className="flex flex-col gap-block">
                  <h3 className="font-medium text-foreground text-label">
                    Contact
                  </h3>
                  <div className="flex flex-col gap-element">
                    <div className="flex items-center gap-element text-label">
                      <MailIcon className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {selectedSubmission.email}
                      </span>
                    </div>
                    {selectedSubmission.phone && (
                      <div className="flex items-center gap-element text-label">
                        <PhoneIcon className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {selectedSubmission.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedSubmission.resumeUrl && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-block">
                      <h3 className="font-medium text-foreground text-label">
                        Resume
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        leftSection={<ExternalLinkIcon />}
                        href={selectedSubmission.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View resume
                      </Button>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex flex-col gap-block">
                  <h3 className="font-medium text-foreground text-label">
                    Submitted
                  </h3>
                  <p className="text-label text-muted-foreground">
                    {day(selectedSubmission.createdAt).format("LLL")}
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
