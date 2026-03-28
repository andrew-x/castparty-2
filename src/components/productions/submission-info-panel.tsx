"use client"

import { FileTextIcon, LayersIcon } from "lucide-react"
import dynamic from "next/dynamic"
import { useState } from "react"
import { Separator } from "@/components/common/separator"
import { SocialIcon } from "@/components/common/social-icons"
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

  function updateLightbox(index: number | null) {
    setLightboxIndex(index)
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
                <button
                  type="button"
                  onClick={() => onNavigateToSubmission?.(role.submissionId)}
                  className="font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                >
                  {role.roleName}
                </button>
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
          <div className="flex flex-col gap-element">
            {submissionFormFields.map((field) => {
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
