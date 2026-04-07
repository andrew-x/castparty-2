"use server"

import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export interface RecentInboundEmail {
  id: string
  fromEmail: string | null
  subject: string
  sentAt: Date
  submissionId: string | null
  productionId: string | null
}

export async function getRecentInboundEmails(): Promise<RecentInboundEmail[]> {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  const emails = await db.query.Email.findMany({
    where: (e, { and, eq }) =>
      and(eq(e.organizationId, orgId), eq(e.direction, "inbound")),
    orderBy: (e, { desc }) => desc(e.sentAt),
    limit: 10,
    with: {
      submission: {
        columns: { productionId: true },
      },
    },
    columns: {
      id: true,
      fromEmail: true,
      subject: true,
      sentAt: true,
      submissionId: true,
    },
  })

  return emails.map((e) => ({
    id: e.id,
    fromEmail: e.fromEmail,
    subject: e.subject,
    sentAt: e.sentAt,
    submissionId: e.submissionId,
    productionId: e.submission?.productionId ?? null,
  }))
}
