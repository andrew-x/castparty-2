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
        headshots,
        resume,
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
  const candidateIds = [...new Set(submissions.map((s) => s.candidate.id))]
  const otherRoleSubmissions: Record<string, OtherRoleSubmission[]> = {}

  if (candidateIds.length > 0) {
    // Build a map of candidateId -> set of roleIds they submitted to
    const candidateRoles = new Map<string, Set<string>>()
    for (const sub of submissions) {
      const existing = candidateRoles.get(sub.candidate.id)
      if (existing) {
        existing.add(sub.roleId)
      } else {
        candidateRoles.set(sub.candidate.id, new Set([sub.roleId]))
      }
    }

    // Build a roleId -> roleName lookup
    const roleNameMap = new Map<string, string>()
    for (const role of production.roles) {
      roleNameMap.set(role.id, role.name)
    }

    // For each candidate, all roles except the ones we could filter by are "other"
    // Since this is production-level (all roles visible), every role a candidate
    // submitted to is listed so consumers can determine cross-role overlap
    for (const [candidateId, roleIds] of candidateRoles) {
      if (roleIds.size > 1) {
        const allRoles: OtherRoleSubmission[] = []
        for (const rid of roleIds) {
          allRoles.push({
            roleId: rid,
            roleName: roleNameMap.get(rid) ?? "",
          })
        }
        otherRoleSubmissions[candidateId] = allRoles
      }
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
