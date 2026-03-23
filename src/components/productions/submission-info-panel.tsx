"use client"

import {
  FileTextIcon,
  ImagePlusIcon,
  LayersIcon,
  LoaderCircleIcon,
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { addSubmissionFiles } from "@/actions/submissions/add-submission-files"
import { presignHeadshotUpload } from "@/actions/submissions/presign-headshot-upload"
import { presignResumeUpload } from "@/actions/submissions/presign-resume-upload"
import { Button } from "@/components/common/button"
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
  productionId: string
  otherRoles: OtherRoleSubmission[]
  onLightboxOpenChange?: (open: boolean) => void
}

export function SubmissionInfoPanel({
  submission,
  submissionFormFields,
  productionId,
  otherRoles,
  onLightboxOpenChange,
}: SubmissionInfoPanelProps) {
  const router = useRouter()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [uploadingHeadshots, setUploadingHeadshots] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const headshotInputId = `headshot-input-${submission.id}`
  const resumeInputId = `resume-input-${submission.id}`

  function updateLightbox(index: number | null) {
    setLightboxIndex(index)
    onLightboxOpenChange?.(index !== null)
  }

  async function handleHeadshotSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected || selected.length === 0) return

    setUploadError(null)
    setUploadingHeadshots(true)

    try {
      const files = Array.from(selected)

      const presignResult = await presignHeadshotUpload({
        files: files.map((f) => ({
          filename: f.name,
          contentType: f.type,
          size: f.size,
        })),
      })

      if (!presignResult?.data?.files) {
        throw new Error(
          presignResult?.serverError ?? "Failed to prepare upload.",
        )
      }

      const presigned = presignResult.data.files

      await Promise.all(
        presigned.map(async ({ presignedUrl }, i) => {
          const res = await fetch(presignedUrl, {
            method: "PUT",
            body: files[i],
            headers: { "Content-Type": files[i].type },
          })
          if (!res.ok) throw new Error("Upload failed.")
        }),
      )

      const headshotMeta = presigned.map(({ key }, i) => ({
        key,
        filename: files[i].name,
        contentType: files[i].type,
        size: files[i].size,
      }))

      await addSubmissionFiles({
        submissionId: submission.id,
        headshots: headshotMeta,
      })

      router.refresh()
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      )
    } finally {
      setUploadingHeadshots(false)
      // Reset input so the same file can be re-selected
      e.target.value = ""
    }
  }

  async function handleResumeSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadingResume(true)

    try {
      const presignResult = await presignResumeUpload({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      })

      if (!presignResult?.data) {
        throw new Error(
          presignResult?.serverError ?? "Failed to prepare upload.",
        )
      }

      const { key, presignedUrl } = presignResult.data

      const res = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!res.ok) throw new Error("Upload failed.")

      await addSubmissionFiles({
        submissionId: submission.id,
        resume: {
          key,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        },
      })

      router.refresh()
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      )
    } finally {
      setUploadingResume(false)
      e.target.value = ""
    }
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
                <Link
                  href={`/productions/${productionId}/roles/${role.roleId}`}
                  target="_blank"
                  className="font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                >
                  {role.roleName}
                </Link>
              </span>
            ))}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-block">
        <h3 className="font-medium text-foreground text-label">Headshots</h3>
        {submission.headshots.length > 0 && (
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
        )}
        {submission.headshots.length < 10 && (
          <>
            <input
              id={headshotInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              className="hidden"
              onChange={handleHeadshotSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              leftSection={
                uploadingHeadshots ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <ImagePlusIcon />
                )
              }
              disabled={uploadingHeadshots}
              onClick={() => document.getElementById(headshotInputId)?.click()}
            >
              {uploadingHeadshots ? "Uploading..." : "Add headshots"}
            </Button>
          </>
        )}
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

      <div className="flex flex-col gap-block">
        <h3 className="font-medium text-foreground text-label">Resume</h3>
        {submission.resume ? (
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
        ) : (
          <>
            <input
              id={resumeInputId}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleResumeSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              leftSection={
                uploadingResume ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <FileTextIcon />
                )
              }
              disabled={uploadingResume}
              onClick={() => document.getElementById(resumeInputId)?.click()}
            >
              {uploadingResume ? "Uploading..." : "Add resume"}
            </Button>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-caption text-destructive">{uploadError}</p>
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
                    <p className="text-label text-muted-foreground/60 italic">
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
