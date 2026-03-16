"use client"

import {
  ExternalLinkIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useState } from "react"

const HeadshotLightbox = dynamic(
  () =>
    import("@/components/productions/headshot-lightbox").then(
      (mod) => mod.HeadshotLightbox,
    ),
  { ssr: false },
)

import { EditCandidateDialog } from "@/components/candidates/edit-candidate-dialog"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { Page, PageContent, PageHeader } from "@/components/common/page"
import { Separator } from "@/components/common/separator"
import { SocialIcon } from "@/components/common/social-icons"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/tabs"
import { FeedbackPanel } from "@/components/productions/feedback-panel"
import day from "@/lib/dayjs"
import { prettifyUrl } from "@/lib/social-links"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import { getStageBadgeProps } from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"
import { cn } from "@/lib/util"

interface SubmissionRow {
  submission: SubmissionWithCandidate
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  feedbackFormFields: CustomForm[]
  roleName: string
  productionName: string
  productionId: string
  roleId: string
}

interface Props {
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    location: string
    createdAt: Date | string
  }
  submissions: SubmissionRow[]
}

function ContactInfo({ candidate }: { candidate: Props["candidate"] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-group gap-y-element text-label">
      <div className="flex items-center gap-element">
        <MailIcon className="size-4 text-muted-foreground" />
        <span>{candidate.email}</span>
      </div>
      {candidate.phone && (
        <div className="flex items-center gap-element">
          <PhoneIcon className="size-4 text-muted-foreground" />
          <span>{candidate.phone}</span>
        </div>
      )}
      {candidate.location && (
        <div className="flex items-center gap-element">
          <MapPinIcon className="size-4 text-muted-foreground" />
          <span>{candidate.location}</span>
        </div>
      )}
    </div>
  )
}

function SubmissionNav({
  submissions,
  selectedIndex,
  onSelect,
}: {
  submissions: SubmissionRow[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <nav className="w-60 shrink-0 overflow-y-auto border-r">
      <div className="flex flex-col py-1">
        {submissions.map((row, index) => (
          <button
            key={row.submission.id}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors",
              index === selectedIndex ? "bg-accent" : "hover:bg-muted",
            )}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-caption text-foreground">
                {row.productionName}
              </p>
              <p className="truncate text-caption text-muted-foreground">
                {row.roleName}
              </p>
            </div>
            {row.submission.stage && (
              <Badge
                {...getStageBadgeProps(row.submission.stage)}
                className="shrink-0 text-caption"
              >
                {row.submission.stage.name}
              </Badge>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function CandidateDetail({ candidate, submissions }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const selected = submissions[selectedIndex] ?? null
  const submission = selected?.submission ?? null
  const fullName = `${candidate.firstName} ${candidate.lastName}`

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset lightbox when active submission changes
  useEffect(() => {
    setLightboxIndex(null)
  }, [selectedIndex])

  return (
    <Page className="gap-0">
      <PageHeader
        title={fullName}
        breadcrumbs={[
          { label: "Candidates", href: "/candidates" },
          { label: fullName },
        ]}
        description={<ContactInfo candidate={candidate} />}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftSection={<PencilIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Edit
          </Button>
        }
      />
      <PageContent isFlush className="min-h-0 overflow-hidden">
        {submissions.length === 0 ? (
          <p className="text-label text-muted-foreground">
            No submissions yet.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1">
            <SubmissionNav
              submissions={submissions}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />

            {submission && (
              <Tabs
                defaultValue="submission"
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex items-center justify-between px-4 pt-1.5 pb-0">
                  <div className="flex min-w-0 items-center gap-element">
                    <p className="font-medium text-foreground text-label">
                      {selected.productionName} &mdash; {selected.roleName}
                    </p>
                    <Badge variant="outline" className="shrink-0 text-caption">
                      {submission.stage?.name ?? "Inbound"}
                    </Badge>
                  </div>
                  <Link
                    href={`/productions/${selected.productionId}/roles/${selected.roleId}?submission=${submission.id}`}
                    className="flex shrink-0 items-center gap-1 text-caption text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View in role
                    <ExternalLinkIcon className="size-3" />
                  </Link>
                </div>
                <TabsList variant="line" className="border-b px-4">
                  <TabsTrigger value="submission">Submission</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="submission"
                  className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
                >
                  <div className="flex flex-col gap-block">
                    {submission.headshots.length > 0 && (
                      <div className="flex flex-col gap-element">
                        <h3 className="font-medium text-caption text-foreground">
                          Headshots
                        </h3>
                        <div className="grid grid-cols-3 gap-1.5">
                          {submission.headshots.map((headshot, i) => (
                            <button
                              key={headshot.id}
                              type="button"
                              onClick={() => setLightboxIndex(i)}
                              className="aspect-square overflow-hidden rounded-md border border-border"
                            >
                              {/* biome-ignore lint/performance/noImgElement: external R2 URLs */}
                              <img
                                src={headshot.url}
                                alt={headshot.filename}
                                className="size-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                        <HeadshotLightbox
                          open={lightboxIndex !== null}
                          index={lightboxIndex ?? 0}
                          onClose={() => setLightboxIndex(null)}
                          slides={submission.headshots.map((h) => ({
                            src: h.url,
                            alt: h.filename,
                          }))}
                        />
                      </div>
                    )}

                    {submission.resume && (
                      <div className="flex flex-col gap-element">
                        <h3 className="font-medium text-caption text-foreground">
                          Resume
                        </h3>
                        <a
                          href={submission.resume.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-element rounded-md border border-border px-2.5 py-1.5 text-caption text-foreground transition-colors hover:bg-muted/50"
                        >
                          <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">
                            {submission.resume.filename}
                          </span>
                        </a>
                      </div>
                    )}

                    {submission.links.length > 0 && (
                      <>
                        <Separator />
                        <div className="flex flex-col gap-element">
                          <h3 className="font-medium text-caption text-foreground">
                            Links
                          </h3>
                          <div className="flex flex-col gap-1">
                            {submission.links.map((link) => (
                              <a
                                key={link}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-element text-caption text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <SocialIcon
                                  url={link}
                                  className="size-3.5 shrink-0"
                                />
                                <span className="min-w-0 truncate">
                                  {prettifyUrl(link)}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium text-caption text-foreground">
                        Submitted
                      </h3>
                      <p className="text-caption text-muted-foreground">
                        {day(submission.createdAt).format("LLL")}
                      </p>
                    </div>

                    {submission.answers.length > 0 && (
                      <div className="flex flex-col gap-element">
                        <h3 className="font-medium text-caption text-foreground">
                          Form responses
                        </h3>
                        <div className="flex flex-col gap-1.5">
                          {submission.answers.map((answer) => {
                            const field = selected.submissionFormFields.find(
                              (f) => f.id === answer.fieldId,
                            )
                            if (!field) return null

                            let displayValue: string
                            if (
                              field.type === "TEXT" ||
                              field.type === "TEXTAREA"
                            ) {
                              displayValue = answer.textValue ?? ""
                            } else if (field.type === "SELECT") {
                              displayValue = answer.optionValues?.[0] ?? ""
                            } else if (field.type === "CHECKBOX_GROUP") {
                              displayValue =
                                answer.optionValues?.join(", ") ?? ""
                            } else {
                              displayValue = answer.booleanValue ? "Yes" : "No"
                            }

                            if (!displayValue) return null

                            return (
                              <div key={answer.fieldId}>
                                <p className="font-medium text-caption text-muted-foreground">
                                  {field.label}
                                </p>
                                <p className="text-caption text-foreground">
                                  {displayValue}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="feedback"
                  className="min-h-0 flex-1 overflow-hidden"
                >
                  <FeedbackPanel
                    submission={submission}
                    feedbackFormFields={selected.feedbackFormFields}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </PageContent>

      <EditCandidateDialog
        candidate={candidate}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </Page>
  )
}
