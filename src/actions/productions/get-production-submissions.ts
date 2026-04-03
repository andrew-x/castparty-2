"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import type {
  CommentData,
  EmailData,
  FeedbackData,
  HeadshotData,
  OtherRoleSubmission,
  ResumeData,
  StageChangeData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { Representation } from "@/lib/types"

export async function getProductionSubmissions(productionId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return null

  const production = await db.query.Production.findFirst({
    where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
    columns: {
      id: true,
      feedbackFormFields: true,
      submissionFormFields: true,
      systemFieldConfig: true,
      rejectReasons: true,
    },
    with: {
      pipelineStages: {
        orderBy: (s, { asc }) => [asc(s.order)],
      },
      roles: {
        with: {
          submissions: {
            with: {
              candidate: true,
              stage: true,
              files: {
                orderBy: (f, { asc }) => [asc(f.order)],
              },
              feedback: {
                with: {
                  submittedBy: {
                    columns: { id: true, name: true, image: true },
                  },
                  stage: { columns: { id: true, name: true } },
                },
                orderBy: (f, { desc }) => [desc(f.createdAt)],
              },
              comments: {
                with: {
                  submittedBy: {
                    columns: { id: true, name: true, image: true },
                  },
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
      },
    },
  })

  if (!production) return null

  // Flatten all submissions across roles, tagging each with its role info
  const submissions: SubmissionWithCandidate[] = []

  for (const role of production.roles) {
    for (const sub of role.submissions) {
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

      const customFieldFiles: Record<
        string,
        { id: string; url: string; filename: string; contentType: string }[]
      > = {}
      for (const f of allFiles) {
        if (f.type !== "CUSTOM_FIELD" || !f.formFieldId) continue
        if (!customFieldFiles[f.formFieldId]) {
          customFieldFiles[f.formFieldId] = []
        }
        customFieldFiles[f.formFieldId].push({
          id: f.id,
          url: f.url,
          filename: f.filename,
          contentType: f.contentType,
        })
      }

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

      const comments: CommentData[] = sub.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        submittedBy: c.submittedBy,
      }))

      const stageChanges: StageChangeData[] = sub.pipelineUpdates.map((pu) => ({
        id: pu.id,
        fromStageName: pu.fromStage?.name ?? null,
        toStageName: pu.toStage?.name ?? null,
        changedBy: pu.changedBy,
        createdAt: pu.createdAt,
      }))

      const emails: EmailData[] = sub.emails.map((e) => ({
        id: e.id,
        subject: e.subject,
        bodyText: e.bodyText,
        templateType: e.templateType,
        direction: e.direction,
        fromEmail: e.fromEmail,
        sentBy: e.sentBy,
        sentAt: e.sentAt,
      }))

      submissions.push({
        id: sub.id,
        roleId: role.id,
        roleName: role.name,
        firstName: sub.firstName,
        lastName: sub.lastName,
        email: sub.email,
        phone: sub.phone,
        location: sub.location,
        createdAt: sub.createdAt,
        stageId: sub.stageId,
        rejectionReason: sub.rejectionReason,
        stage: sub.stage,
        answers: sub.answers,
        links: sub.links,
        videoUrl: sub.videoUrl,
        unionStatus: sub.unionStatus,
        representation: sub.representation as Representation | null,
        headshots,
        resume,
        customFieldFiles,
        resumeText: sub.resumeText,
        feedback,
        comments,
        stageChanges,
        emails,
        candidate: sub.candidate,
      })
    }
  }

  // Build cross-role submission lookup keyed by candidateId
  const otherRoleSubmissions: Record<string, OtherRoleSubmission[]> = {}

  // Build a map of candidateId -> list of {roleId, submissionId} they submitted to
  const candidateRoles = new Map<
    string,
    { roleId: string; submissionId: string }[]
  >()
  for (const sub of submissions) {
    const existing = candidateRoles.get(sub.candidate.id)
    const entry = { roleId: sub.roleId, submissionId: sub.id }
    if (existing) {
      existing.push(entry)
    } else {
      candidateRoles.set(sub.candidate.id, [entry])
    }
  }

  // Build a roleId -> roleName lookup
  const roleNameMap = new Map<string, string>()
  for (const role of production.roles) {
    roleNameMap.set(role.id, role.name)
  }

  // For each candidate with multiple role submissions, list all roles
  // so consumers can determine cross-role overlap and filter as needed
  for (const [candidateId, entries] of candidateRoles) {
    if (entries.length > 1) {
      otherRoleSubmissions[candidateId] = entries.map((e) => ({
        roleId: e.roleId,
        roleName: roleNameMap.get(e.roleId) ?? "",
        submissionId: e.submissionId,
      }))
    }
  }

  const roles = production.roles.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
  }))

  return {
    roles,
    pipelineStages: production.pipelineStages,
    submissions,
    submissionFormFields: production.submissionFormFields,
    feedbackFormFields: production.feedbackFormFields,
    rejectReasons: production.rejectReasons,
    otherRoleSubmissions,
  }
}
