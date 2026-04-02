"use client"

import { FileTextIcon, LayersIcon } from "lucide-react"
import dynamic from "next/dynamic"
import { useState } from "react"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { Separator } from "@/components/common/separator"
import { SocialIcon } from "@/components/common/social-icons"
import { VideoEmbed } from "@/components/submissions/video-embed"
import day from "@/lib/dayjs"
import { prettifyUrl } from "@/lib/social-links"
import type {
  OtherRoleSubmission,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

const HeadshotLightbox = dynamic(
  () =>
    import("@/components/productions/headshot-lightbox").then(
      (mod) => mod.HeadshotLightbox,
    ),
  { ssr: false },
)

interface SubmissionInfoPanelProps {
  submission: SubmissionWithCandidate
  submissionFormFields: CustomForm[]
  otherRoles: OtherRoleSubmission[]
  onNavigateToSubmission?: (submissionId: string) => void
  onLightboxOpenChange?: (open: boolean) => void
}

export function SubmissionInfoPanel({
  submission,
  submissionFormFields,
  otherRoles,
  onNavigateToSubmission,
  onLightboxOpenChange,
}: SubmissionInfoPanelProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [customFieldLightbox, setCustomFieldLightbox] = useState<{
    fieldId: string
    index: number
  } | null>(null)

  function updateLightbox(index: number | null) {
    setLightboxIndex(index)
    onLightboxOpenChange?.(index !== null)
  }

  function updateCustomFieldLightbox(fieldId: string, index: number | null) {
    setCustomFieldLightbox(index !== null ? { fieldId, index } : null)
    onLightboxOpenChange?.(index !== null)
  }

  return (
    <div className="flex flex-col gap-group">
      {otherRoles.length > 0 && (
        <div className="flex items-start gap-element rounded-lg bg-muted/50 p-block">
          <LayersIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-label text-muted-foreground">
            Also submitted for{" "}
            {otherRoles.map((role, i) => (
              <span key={role.roleId}>
                {i > 0 && (i === otherRoles.length - 1 ? " and " : ", ")}
                <Button
                  variant="link"
                  onClick={() => onNavigateToSubmission?.(role.submissionId)}
                  className="h-auto p-0 text-foreground"
                >
                  {role.roleName}
                </Button>
              </span>
            ))}
          </p>
        </div>
      )}

      {submission.headshots.length > 0 && (
        <div className="flex flex-col gap-block">
          <h3 className="font-medium text-foreground text-label">Headshots</h3>
          <div className="grid grid-cols-3 gap-element">
            {submission.headshots.map((headshot, i) => (
              <button
                key={headshot.id}
                type="button"
                onClick={() => updateLightbox(i)}
                className="aspect-square overflow-hidden rounded-lg border border-border"
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
            onClose={() => updateLightbox(null)}
            slides={submission.headshots.map((h) => ({
              src: h.url,
              alt: h.filename,
            }))}
          />
        </div>
      )}

      {submission.resume && (
        <div className="flex flex-col gap-block">
          <h3 className="font-medium text-foreground text-label">Resume</h3>
          <a
            href={submission.resume.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-element rounded-lg border border-border px-3 py-2 text-foreground text-label transition-colors hover:bg-muted/50"
          >
            <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              {submission.resume.filename}
            </span>
          </a>
        </div>
      )}

      {submission.videoUrls.length > 0 && (
        <div className="flex flex-col gap-block">
          <h3 className="font-medium text-foreground text-label">Videos</h3>
          <div className="flex flex-col gap-element">
            {submission.videoUrls.map((url) => (
              <VideoEmbed key={url} url={url} />
            ))}
          </div>
        </div>
      )}

      {submission.links.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-block">
            <h3 className="font-medium text-foreground text-label">Links</h3>
            <div className="flex flex-col gap-element">
              {submission.links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-element text-label text-muted-foreground transition-colors hover:text-foreground"
                >
                  <SocialIcon url={link} className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{prettifyUrl(link)}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      {submission.unionStatus.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-block">
            <h3 className="font-medium text-foreground text-label">
              Union affiliations
            </h3>
            <div className="flex flex-wrap gap-1">
              {submission.unionStatus.map((union) => (
                <Badge key={union} variant="secondary">
                  {union}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {submission.representation && (
        <>
          <Separator />
          <div className="flex flex-col gap-block">
            <h3 className="font-medium text-foreground text-label">
              Representation
            </h3>
            <div className="flex flex-col gap-element text-label text-muted-foreground">
              <span>{submission.representation.name}</span>
              <a
                href={`mailto:${submission.representation.email}`}
                className="transition-colors hover:text-foreground"
              >
                {submission.representation.email}
              </a>
              {submission.representation.phone && (
                <span>{submission.representation.phone}</span>
              )}
            </div>
          </div>
        </>
      )}

      <Separator />

      <div className="flex flex-col gap-block">
        <h3 className="font-medium text-foreground text-label">Submitted</h3>
        <p className="text-label text-muted-foreground">
          {day(submission.createdAt).format("LLL")}
        </p>
      </div>

      {submissionFormFields.length > 0 && (
        <div className="flex flex-col gap-block">
          <h3 className="font-medium text-foreground text-label">
            Form responses
          </h3>
          <div className="flex flex-col gap-group">
            {submissionFormFields.map((field) => {
              if (field.type === "IMAGE") {
                const files = submission.customFieldFiles[field.id] ?? []
                return (
                  <div key={field.id}>
                    <p className="font-medium text-caption text-muted-foreground">
                      {field.label}
                    </p>
                    {files.length > 0 ? (
                      <>
                        <div className="mt-1 grid grid-cols-3 gap-element">
                          {files.map((file, i) => (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() =>
                                updateCustomFieldLightbox(field.id, i)
                              }
                              className="aspect-square overflow-hidden rounded-lg border border-border"
                            >
                              {/* biome-ignore lint/performance/noImgElement: external R2 URLs */}
                              <img
                                src={file.url}
                                alt={file.filename}
                                className="size-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                        <HeadshotLightbox
                          open={customFieldLightbox?.fieldId === field.id}
                          index={customFieldLightbox?.index ?? 0}
                          onClose={() =>
                            updateCustomFieldLightbox(field.id, null)
                          }
                          slides={files.map((f) => ({
                            src: f.url,
                            alt: f.filename,
                          }))}
                        />
                      </>
                    ) : (
                      <p className="text-label text-muted-foreground italic">
                        Not provided
                      </p>
                    )}
                  </div>
                )
              }

              if (field.type === "DOCUMENT") {
                const files = submission.customFieldFiles[field.id] ?? []
                const doc = files[0]
                return (
                  <div key={field.id}>
                    <p className="font-medium text-caption text-muted-foreground">
                      {field.label}
                    </p>
                    {doc ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center gap-element rounded-lg border border-border px-3 py-2 text-foreground text-label transition-colors hover:bg-muted/50"
                      >
                        <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">
                          {doc.filename}
                        </span>
                      </a>
                    ) : (
                      <p className="text-label text-muted-foreground italic">
                        Not provided
                      </p>
                    )}
                  </div>
                )
              }

              const answer = submission.answers.find(
                (a) => a.fieldId === field.id,
              )

              let displayValue = ""
              if (answer) {
                if (field.type === "TEXT" || field.type === "TEXTAREA") {
                  displayValue = answer.textValue ?? ""
                } else if (field.type === "SELECT") {
                  displayValue = answer.optionValues?.[0] ?? ""
                } else if (field.type === "CHECKBOX_GROUP") {
                  displayValue = answer.optionValues?.join(", ") ?? ""
                } else {
                  displayValue = answer.booleanValue ? "Yes" : "No"
                }
              }

              return (
                <div key={field.id}>
                  <p className="font-medium text-caption text-muted-foreground">
                    {field.label}
                  </p>
                  {displayValue ? (
                    <p className="text-foreground text-label">{displayValue}</p>
                  ) : (
                    <p className="text-label text-muted-foreground italic">
                      Not answered
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
