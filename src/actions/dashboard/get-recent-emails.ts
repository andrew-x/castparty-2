"use server"

import { and, desc, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Email, Submission } from "@/lib/db/schema"

export interface RecentEmail {
  id: string
  fromEmail: string | null
  subject: string
  sentAt: Date
  submissionId: string | null
  productionId: string | null
}

export async function getRecentEmails(): Promise<RecentEmail[]> {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  const rows = await db
    .select({
      id: Email.id,
      fromEmail: Email.fromEmail,
      subject: Email.subject,
      sentAt: Email.sentAt,
      submissionId: Email.submissionId,
      productionId: Submission.productionId,
    })
    .from(Email)
    .leftJoin(Submission, eq(Email.submissionId, Submission.id))
    .where(and(eq(Email.organizationId, orgId), eq(Email.direction, "inbound")))
    .orderBy(desc(Email.sentAt))
    .limit(10)

  return rows
}
