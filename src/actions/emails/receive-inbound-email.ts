import { eq } from "drizzle-orm"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { Email } from "@/lib/db/schema"
import logger from "@/lib/logger"
import { generateId } from "@/lib/util"

interface InboundEmailData {
  resendEmailId: string | undefined
  submissionId: string
  fromEmail: string
  toAddresses: string[]
  subject: string
  bodyText: string
  bodyHtml: string
  createdAt: string | undefined
}

/**
 * Stores an inbound email for a submission. Returns false if the email
 * was already processed (duplicate webhook delivery).
 */
export async function receiveInboundEmail(
  data: InboundEmailData,
): Promise<boolean> {
  // Deduplicate using Resend's email_id when available
  const resendId = data.resendEmailId
  if (resendId) {
    const existing = await db.query.Email.findFirst({
      where: (e) => eq(e.resendEmailId, resendId),
      columns: { id: true },
    })
    if (existing) {
      logger.info("[Inbound] Skipping duplicate email:", data.resendEmailId)
      return false
    }
  }

  const submission = await db.query.Submission.findFirst({
    where: (s) => eq(s.id, data.submissionId),
    columns: { id: true },
    with: {
      role: {
        columns: { id: true },
        with: { production: { columns: { organizationId: true } } },
      },
    },
  })

  if (!submission) {
    logger.error("[Inbound] Submission not found for ID:", data.submissionId)
    return false
  }

  const sentAt = data.createdAt ? day(data.createdAt).toDate() : day().toDate()

  await db.insert(Email).values({
    id: generateId("eml"),
    organizationId: submission.role.production.organizationId,
    submissionId: data.submissionId,
    sentByUserId: null,
    direction: "inbound",
    fromEmail: data.fromEmail,
    toEmail: data.toAddresses.join(", "),
    subject: data.subject,
    bodyText: data.bodyText,
    bodyHtml: data.bodyHtml,
    templateType: null,
    resendEmailId: data.resendEmailId ?? null,
    sentAt,
  })

  return true
}
