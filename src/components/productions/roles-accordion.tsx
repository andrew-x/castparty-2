"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ExternalLinkIcon,
  LinkIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
  XIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { addPipelineStage } from "@/actions/productions/add-pipeline-stage"
import { createRole } from "@/actions/productions/create-role"
import { removePipelineStage } from "@/actions/productions/remove-pipeline-stage"
import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"
import { Separator } from "@/components/common/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/common/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/tabs"
import { Textarea } from "@/components/common/textarea"
import day from "@/lib/dayjs"
import { getAppUrl } from "@/lib/url"

const addRoleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim().optional(),
})

interface PipelineStageData {
  id: string
  name: string
  slug: string
  position: number
  isSystem: boolean
  isTerminal: boolean
}

interface SubmissionWithCandidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  resumeUrl: string | null
  createdAt: Date | string
  stageId: string | null
  stage: PipelineStageData | null
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
  slug: string
  description: string | null
  pipelineStages: PipelineStageData[]
  submissions: SubmissionWithCandidate[]
}

interface Props {
  orgSlug: string
  productionSlug: string
  productionId: string
  initialRoles: RoleWithSubmissions[]
}

function getStageBadgeProps(stage: PipelineStageData | null): {
  variant: "secondary" | "destructive" | "outline"
  className?: string
} {
  if (!stage || stage.slug === "inbound") return { variant: "secondary" }
  if (stage.slug === "cast")
    return {
      variant: "outline",
      className: "border-success-text/30 bg-success-light text-success-text",
    }
  if (stage.slug === "rejected") return { variant: "destructive" }
  return { variant: "outline" }
}

function getStageLabel(submission: SubmissionWithCandidate): string {
  return submission.stage?.name ?? "Inbound"
}

function resolveStageSlug(submission: SubmissionWithCandidate): string {
  return submission.stage?.slug ?? "inbound"
}

export function RolesAccordion({
  orgSlug,
  productionSlug,
  productionId,
  initialRoles,
}: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithCandidate | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [configRoleId, setConfigRoleId] = useState<string | null>(null)
  const [newStageName, setNewStageName] = useState("")

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

  const { execute: executeStatusChange } = useAction(updateSubmissionStatus, {
    onSuccess() {
      router.refresh()
    },
  })

  const { execute: executeAddStage, isPending: isAddingStage } = useAction(
    addPipelineStage,
    {
      onSuccess() {
        setNewStageName("")
        router.refresh()
      },
    },
  )

  const { execute: executeRemoveStage } = useAction(removePipelineStage, {
    onSuccess() {
      router.refresh()
    },
  })

  function handleStatusChange(submissionId: string, stageId: string) {
    executeStatusChange({ submissionId, stageId })
    // Optimistically update the selected submission in the sheet
    if (selectedSubmission && selectedSubmission.id === submissionId) {
      const role = initialRoles.find((r) => r.id === selectedRoleId)
      const newStage =
        role?.pipelineStages.find((s) => s.id === stageId) ?? null
      setSelectedSubmission({ ...selectedSubmission, stageId, stage: newStage })
    }
  }

  function handleAddStage(roleId: string) {
    if (!newStageName.trim()) return
    executeAddStage({ roleId, name: newStageName.trim() })
  }

  function handleRemoveStage(stageId: string) {
    executeRemoveStage({ stageId })
  }

  // Find the role for the currently selected submission
  const selectedRole = selectedRoleId
    ? initialRoles.find((r) => r.id === selectedRoleId)
    : null

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
                      /submit/{orgSlug}/{productionSlug}/{role.slug}
                    </p>
                    <CopyButton
                      value={getAppUrl(
                        `/submit/${orgSlug}/${productionSlug}/${role.slug}`,
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-element">
                    <Button
                      href={`/submit/${orgSlug}/${productionSlug}/${role.slug}`}
                      variant="outline"
                      size="sm"
                      leftSection={<LinkIcon />}
                      className="w-fit"
                    >
                      View audition page
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftSection={<SettingsIcon />}
                      onClick={() => {
                        setNewStageName("")
                        setConfigRoleId(
                          configRoleId === role.id ? null : role.id,
                        )
                      }}
                    >
                      Pipeline
                    </Button>
                  </div>
                </div>

                {/* Pipeline configuration */}
                {configRoleId === role.id && (
                  <div className="mb-2 flex flex-col gap-element rounded-lg border p-group">
                    <p className="font-medium text-foreground text-label">
                      Pipeline stages
                    </p>
                    <div className="flex flex-col gap-1">
                      {role.pipelineStages.map((stage) => (
                        <div
                          key={stage.id}
                          className="flex items-center justify-between rounded-md px-2 py-1 text-label"
                        >
                          <span className="text-muted-foreground">
                            {stage.name}
                            {stage.isSystem && (
                              <span className="ml-1 text-caption text-muted-foreground/60">
                                (system)
                              </span>
                            )}
                          </span>
                          {!stage.isSystem && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => handleRemoveStage(stage.id)}
                            >
                              <XIcon className="size-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-element">
                      <Input
                        type="text"
                        placeholder="New stage name"
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddStage(role.id)
                          }
                        }}
                        className="h-8"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddStage(role.id)}
                        loading={isAddingStage}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                {/* Submissions with tab filtering */}
                {role.submissions.length === 0 ? (
                  <p className="text-caption text-muted-foreground">
                    No submissions yet.
                  </p>
                ) : (
                  <Tabs defaultValue="all">
                    <TabsList variant="line" className="flex-wrap">
                      <TabsTrigger value="all">
                        All{" "}
                        <Badge variant="secondary" className="ml-1">
                          {role.submissions.length}
                        </Badge>
                      </TabsTrigger>
                      {role.pipelineStages.map((stage) => {
                        const count = role.submissions.filter(
                          (s) => resolveStageSlug(s) === stage.slug,
                        ).length
                        if (count === 0) return null
                        return (
                          <TabsTrigger key={stage.id} value={stage.slug}>
                            {stage.name}{" "}
                            <Badge variant="secondary" className="ml-1">
                              {count}
                            </Badge>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                    <TabsContent value="all">
                      <SubmissionList
                        submissions={role.submissions}
                        onSelect={(s) => {
                          setSelectedSubmission(s)
                          setSelectedRoleId(role.id)
                        }}
                      />
                    </TabsContent>
                    {role.pipelineStages.map((stage) => (
                      <TabsContent key={stage.id} value={stage.slug}>
                        <SubmissionList
                          submissions={role.submissions.filter(
                            (s) => resolveStageSlug(s) === stage.slug,
                          )}
                          onSelect={(s) => {
                            setSelectedSubmission(s)
                            setSelectedRoleId(role.id)
                          }}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Sheet
        open={!!selectedSubmission}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubmission(null)
            setSelectedRoleId(null)
          }
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
                {/* Status selector */}
                {selectedRole && (
                  <div className="flex flex-col gap-block">
                    <h3 className="font-medium text-foreground text-label">
                      Status
                    </h3>
                    <Select
                      value={
                        selectedSubmission.stageId ??
                        selectedRole.pipelineStages.find(
                          (s) => s.slug === "inbound",
                        )?.id ??
                        ""
                      }
                      onValueChange={(value) =>
                        handleStatusChange(selectedSubmission.id, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedRole.pipelineStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

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

function SubmissionList({
  submissions,
  onSelect,
}: {
  submissions: SubmissionWithCandidate[]
  onSelect: (s: SubmissionWithCandidate) => void
}) {
  if (submissions.length === 0) {
    return (
      <p className="py-2 text-caption text-muted-foreground">
        No submissions in this stage.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-element">
      {submissions.map((submission) => {
        const badgeProps = getStageBadgeProps(submission.stage)
        return (
          <Button
            key={submission.id}
            variant="ghost"
            onClick={() => onSelect(submission)}
            className="h-auto w-full justify-between p-2 text-left"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-element">
                <span className="font-medium text-foreground text-label">
                  {submission.firstName} {submission.lastName}
                </span>
                <Badge
                  variant={badgeProps.variant}
                  className={badgeProps.className}
                >
                  {getStageLabel(submission)}
                </Badge>
              </div>
              <span className="text-caption text-muted-foreground">
                {submission.email}
              </span>
            </div>
            <span className="text-caption text-muted-foreground">
              {day(submission.createdAt).format("LL")}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
