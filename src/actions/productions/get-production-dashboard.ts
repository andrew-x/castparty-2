"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export interface DashboardSubmission {
  id: string
  roleId: string
  stageId: string
  createdAt: Date | string
  rejectionReason: string | null
}

export interface DashboardStage {
  id: string
  name: string
  order: number
  type: "APPLIED" | "CUSTOM" | "SELECTED" | "REJECTED"
}

export interface DashboardRole {
  id: string
  name: string
}

export interface DashboardEmail {
  id: string
  roleId: string
  subject: string
  direction: string
  candidateName: string
  sentAt: Date | string
}

export interface DashboardComment {
  id: string
  roleId: string
  content: string
  candidateName: string
  submittedByName: string
  createdAt: Date | string
}

export interface DashboardFeedback {
  id: string
  roleId: string
  rating: string | null
  notes: string
  candidateName: string
  submittedByName: string
  stageName: string
  createdAt: Date | string
}

export interface DashboardData {
  submissions: DashboardSubmission[]
  pipelineStages: DashboardStage[]
  roles: DashboardRole[]
  recentEmails: DashboardEmail[]
  recentActivity: (DashboardComment | DashboardFeedback)[]
}

export async function getProductionDashboard(
  productionId: string,
): Promise<DashboardData | null> {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return null

  const production = await db.query.Production.findFirst({
    where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
    columns: {
      id: true,
    },
    with: {
      pipelineStages: {
        columns: { id: true, name: true, order: true, type: true },
        orderBy: (s, { asc }) => [asc(s.order)],
      },
      roles: {
        columns: { id: true, name: true },
        with: {
          submissions: {
            columns: {
              id: true,
              stageId: true,
              createdAt: true,
              rejectionReason: true,
            },
            with: {
              candidate: {
                columns: { firstName: true, lastName: true },
              },
              emails: {
                columns: {
                  id: true,
                  subject: true,
                  direction: true,
                  sentAt: true,
                },
                orderBy: (e, { desc }) => [desc(e.sentAt)],
                limit: 10,
              },
              comments: {
                columns: { id: true, content: true, createdAt: true },
                orderBy: (c, { desc }) => [desc(c.createdAt)],
                limit: 10,
                with: {
                  submittedBy: { columns: { name: true } },
                },
              },
              feedback: {
                columns: {
                  id: true,
                  rating: true,
                  notes: true,
                  createdAt: true,
                },
                orderBy: (f, { desc }) => [desc(f.createdAt)],
                limit: 10,
                with: {
                  submittedBy: { columns: { name: true } },
                  stage: { columns: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!production) return null

  const submissions: DashboardSubmission[] = []
  const allEmails: DashboardEmail[] = []
  const allActivity: (DashboardComment | DashboardFeedback)[] = []

  for (const role of production.roles) {
    for (const sub of role.submissions) {
      const candidateName = `${sub.candidate.firstName} ${sub.candidate.lastName}`

      submissions.push({
        id: sub.id,
        roleId: role.id,
        stageId: sub.stageId,
        createdAt: sub.createdAt,
        rejectionReason: sub.rejectionReason,
      })

      for (const email of sub.emails) {
        if (email.direction !== "inbound") continue
        allEmails.push({
          id: email.id,
          roleId: role.id,
          subject: email.subject,
          direction: email.direction,
          candidateName,
          sentAt: email.sentAt,
        })
      }

      for (const comment of sub.comments) {
        allActivity.push({
          id: comment.id,
          roleId: role.id,
          content: comment.content,
          candidateName,
          submittedByName: comment.submittedBy.name,
          createdAt: comment.createdAt,
        })
      }

      for (const fb of sub.feedback) {
        allActivity.push({
          id: fb.id,
          roleId: role.id,
          rating: fb.rating,
          notes: fb.notes,
          candidateName,
          submittedByName: fb.submittedBy.name,
          stageName: fb.stage.name,
          createdAt: fb.createdAt,
        })
      }
    }
  }

  // Sort by date descending, take most recent 10
  allEmails.sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  )
  allActivity.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()
    return bTime - aTime
  })

  return {
    submissions,
    pipelineStages: production.pipelineStages as DashboardStage[],
    roles: production.roles.map((r) => ({ id: r.id, name: r.name })),
    recentEmails: allEmails.slice(0, 10),
    recentActivity: allActivity.slice(0, 10),
  }
}
