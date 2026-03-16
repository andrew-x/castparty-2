"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import type {
  FeedbackData,
  HeadshotData,
  ResumeData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

export async function getRoleWithSubmissions(roleId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return null

  const role = await db.query.Role.findFirst({
    where: (r) => eq(r.id, roleId),
    with: {
      production: {
        columns: {
          id: true,
          name: true,
          organizationId: true,
          feedbackFormFields: true,
        },
      },
      pipelineStages: {
        orderBy: (s, { asc }) => [asc(s.order)],
      },
      submissions: {
        with: {
          candidate: true,
          stage: true,
          files: {
            orderBy: (f, { asc }) => [asc(f.order)],
          },
          feedback: {
            with: {
              submittedBy: { columns: { id: true, name: true, image: true } },
              stage: { columns: { id: true, name: true } },
            },
            orderBy: (f, { desc }) => [desc(f.createdAt)],
          },
        },
      },
    },
  })

  if (!role || role.production.organizationId !== orgId) return null

  const submissions: SubmissionWithCandidate[] = role.submissions.map((sub) => {
    const allFiles = sub.files
    const headshots: HeadshotData[] = allFiles
      .filter((f) => f.type === "HEADSHOT")
      .map((f) => ({
        id: f.id,
        url: f.url,
        filename: f.filename,
        order: f.order,
      }))
    const resumeFile = allFiles.find((f) => f.type === "RESUME")
    const resume: ResumeData | null = resumeFile
      ? {
          id: resumeFile.id,
          url: resumeFile.url,
          filename: resumeFile.filename,
        }
      : null

    const feedback: FeedbackData[] = sub.feedback.map((fb) => ({
      id: fb.id,
      rating: fb.rating,
      notes: fb.notes,
      formFields: fb.formFields,
      answers: fb.answers,
      createdAt: fb.createdAt,
      submittedBy: fb.submittedBy,
      stage: fb.stage,
    }))

    return {
      id: sub.id,
      firstName: sub.firstName,
      lastName: sub.lastName,
      email: sub.email,
      phone: sub.phone,
      location: sub.location,
      createdAt: sub.createdAt,
      stageId: sub.stageId,
      stage: sub.stage,
      answers: sub.answers,
      links: sub.links,
      headshots,
      resume,
      resumeText: sub.resumeText,
      feedback,
      candidate: sub.candidate,
    }
  })

  // Resolve feedback form fields: role-level if non-empty, else production-level
  const feedbackFormFields: CustomForm[] =
    role.feedbackFormFields.length > 0
      ? role.feedbackFormFields
      : role.production.feedbackFormFields

  return { ...role, submissions, feedbackFormFields }
}
