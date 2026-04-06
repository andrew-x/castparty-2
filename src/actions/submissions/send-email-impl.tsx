import { eq } from "drizzle-orm"
import db from "@/lib/db/db"
import { Email } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email"
import {
  DEFAULT_EMAIL_TEMPLATES,
  interpolateTemplate,
} from "@/lib/email-template"
import { TemplateEmail } from "@/lib/emails/template-email"
import logger from "@/lib/logger"
import type { EmailTemplates } from "@/lib/types"
import { generateId } from "@/lib/util"

export type TemplateType = keyof EmailTemplates

export interface SubmissionEmailData {
  candidate: { firstName: string; lastName: string; email: string }
  role: { name: string }
  production: {
    name: string
    emailTemplates: EmailTemplates | null
    organizationId: string
    organization: { name: string }
  }
}

/**
 * Sends an email for a submission and records it in the Email table.
 * When customSubject/customBody are provided, they are used directly
 * (already interpolated by the client). Otherwise, the production's
 * template is interpolated server-side.
 *
 * templateType can be null for freeform custom emails (requires
 * customSubject and customBody).
 */
export async function sendSubmissionEmail(
  submissionId: string,
  templateType: TemplateType | null,
  customSubject?: string,
  customBody?: string,
  sentByUserId?: string,
  prefetchedSubmission?: SubmissionEmailData,
) {
  const submission =
    prefetchedSubmission ??
    (await db.query.Submission.findFirst({
      where: (s) => eq(s.id, submissionId),
      columns: {},
      with: {
        candidate: {
          columns: { firstName: true, lastName: true, email: true },
        },
        role: { columns: { name: true } },
        production: {
          columns: { name: true, emailTemplates: true, organizationId: true },
          with: { organization: { columns: { name: true } } },
        },
      },
    }))

  if (!submission) throw new Error("Submission not found.")

  let subject: string
  let body: string

  if (customSubject !== undefined && customBody !== undefined) {
    subject = customSubject
    body = customBody
  } else {
    if (!templateType)
      throw new Error(
        "templateType is required when custom subject/body are not provided.",
      )

    const templates =
      (submission.production.emailTemplates as EmailTemplates | null) ??
      DEFAULT_EMAIL_TEMPLATES
    const template = templates[templateType]

    const variables = {
      first_name: submission.candidate.firstName,
      last_name: submission.candidate.lastName,
      production_name: submission.production.name,
      role_name: submission.role.name,
      organization_name: submission.production.organization.name,
    }

    subject = interpolateTemplate(template.subject, variables)
    body = interpolateTemplate(template.body, variables)
  }

  const inboundDomain =
    process.env.INBOUND_EMAIL_DOMAIN ?? "inbound.joincastparty.com"
  const replyTo = `reply+${submissionId}@${inboundDomain}`

  const { html } = await sendEmail({
    to: submission.candidate.email,
    subject,
    react: <TemplateEmail body={body} preview={subject} replyTo={replyTo} />,
    text: `${body}\n\n---\nTo respond, just reply to this email or send a message to ${replyTo}`,
    replyTo,
  })

  try {
    await db.insert(Email).values({
      id: generateId("eml"),
      organizationId: submission.production.organizationId,
      submissionId,
      sentByUserId: sentByUserId ?? null,
      direction: "outbound",
      toEmail: submission.candidate.email,
      subject,
      bodyText: body,
      bodyHtml: html,
      templateType,
    })
  } catch (error) {
    logger.error("[Email] Sent successfully but failed to save record", error)
    throw new Error(
      "Email was sent successfully but could not be saved to the activity log. No need to resend.",
    )
  }
}
