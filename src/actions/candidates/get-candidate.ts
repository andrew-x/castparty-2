"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import type {
  CommentData,
  EmailData,
  FeedbackData,
  PipelineStageData,
  StageChangeData,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

export async function getCandidate(candidateId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return null

  const candidate = await db.query.Candidate.findFirst({
    where: (c) => and(eq(c.id, candidateId), eq(c.organizationId, orgId)),
    with: {
      submissions: {
        with: {
          role: true,
          production: {
            with: {
              pipelineStages: true,
            },
          },
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
          comments: {
            with: {
              submittedBy: { columns: { id: true, name: true, image: true } },
            },
            orderBy: (c, { desc }) => [desc(c.createdAt)],
          },
          pipelineUpdates: {
            with: {
              fromStage: { columns: { name: true } },
              toStage: { columns: { name: true } },
              changedBy: { columns: { name: true } },
            },
            orderBy: (pu, { desc }) => [desc(pu.createdAt)],
          },
          emails: {
            with: {
              sentBy: { columns: { name: true } },
            },
            orderBy: (e, { desc }) => [desc(e.sentAt)],
          },
        },
      },
    },
  })

  if (!candidate) return null

  const submissions = candidate.submissions.map((submission) => {
    const formFields =
      (submission.production?.submissionFormFields as CustomForm[]) ?? []

    const feedbackFormFields =
      (submission.production?.feedbackFormFields as CustomForm[]) ?? []

    const feedback: FeedbackData[] = (submission.feedback ?? []).map((fb) => ({
      id: fb.id,
      rating: fb.rating,
      notes: fb.notes,
      formFields: fb.formFields,
      answers: fb.answers,
      createdAt: fb.createdAt,
      submittedBy: fb.submittedBy,
      stage: fb.stage,
    }))

    const comments: CommentData[] = (submission.comments ?? []).map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      submittedBy: c.submittedBy,
    }))

    const stageChanges: StageChangeData[] = (
      submission.pipelineUpdates ?? []
    ).map((pu) => ({
      id: pu.id,
      fromStageName: pu.fromStage?.name ?? null,
      toStageName: pu.toStage?.name ?? null,
      changedBy: pu.changedBy,
      createdAt: pu.createdAt,
    }))

    const emails: EmailData[] = (submission.emails ?? []).map((e) => ({
      id: e.id,
      subject: e.subject,
      bodyText: e.bodyText,
      templateType: e.templateType,
      direction: e.direction,
      fromEmail: e.fromEmail,
      sentBy: e.sentBy,
      sentAt: e.sentAt,
    }))

    const pipelineStages: PipelineStageData[] = (
      submission.production?.pipelineStages ?? []
    )
      .map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        type: s.type as PipelineStageData["type"],
      }))
      .sort((a, b) => a.order - b.order)

    return {
      submission: {
        id: submission.id,
        roleId: submission.roleId,
        roleName: submission.role?.name ?? "Unknown",
        firstName: submission.firstName,
        lastName: submission.lastName,
        email: submission.email,
        phone: submission.phone,
        location: submission.location,
        createdAt: submission.createdAt,
        stageId: submission.stageId,
        rejectionReason: submission.rejectionReason,
        stage: submission.stage
          ? {
              id: submission.stage.id,
              name: submission.stage.name,
              order: submission.stage.order,
              type: submission.stage.type as PipelineStageData["type"],
            }
          : null,
        answers: submission.answers ?? [],
        headshots: (submission.files ?? [])
          .filter((f) => f.type === "HEADSHOT")
          .map((f) => ({
            id: f.id,
            url: f.url,
            filename: f.filename,
            order: f.order,
          })),
        resume: (() => {
          const r = (submission.files ?? []).find((f) => f.type === "RESUME")
          return r ? { id: r.id, url: r.url, filename: r.filename } : null
        })(),
        links: submission.links,
        resumeText: submission.resumeText ?? null,
        feedback,
        comments,
        stageChanges,
        emails,
        candidate: {
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
        },
      },
      pipelineStages,
      submissionFormFields: formFields,
      feedbackFormFields,
      roleName: submission.role?.name ?? "Unknown",
      productionName: submission.production?.name ?? "Unknown",
      productionId: submission.productionId,
      roleId: submission.roleId,
    }
  })

  return {
    candidate: {
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      createdAt: candidate.createdAt,
    },
    submissions,
  }
}
