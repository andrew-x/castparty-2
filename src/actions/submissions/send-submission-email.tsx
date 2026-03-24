"use server"

import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
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

type TemplateType = keyof EmailTemplates

/**
 * Sends an email for a submission and records it in the Email table.
 * When customSubject/customBody are provided, they are used directly
 * (already interpolated by the client). Otherwise, the production's
 * template is interpolated server-side.
 */
export async function sendSubmissionEmail(
  submissionId: string,
  templateType: TemplateType,
  customSubject?: string,
  customBody?: string,
  sentByUserId?: string,
) {
  const submission = await db.query.Submission.findFirst({
    where: (s) => eq(s.id, submissionId),
    columns: {
      firstName: true,
      lastName: true,
      email: true,
    },
    with: {
      role: { columns: { name: true } },
      production: {
        columns: { name: true, emailTemplates: true, organizationId: true },
        with: { organization: { columns: { name: true } } },
      },
    },
  })

  if (!submission) throw new Error("Submission not found.")

  let subject: string
  let body: string

  if (customSubject !== undefined && customBody !== undefined) {
    subject = customSubject
    body = customBody
  } else {
    const templates =
      (submission.production.emailTemplates as EmailTemplates | null) ??
      DEFAULT_EMAIL_TEMPLATES
    const template = templates[templateType]

    const variables = {
      first_name: submission.firstName,
      last_name: submission.lastName,
      production_name: submission.production.name,
      role_name: submission.role.name,
      organization_name: submission.production.organization.name,
    }

    subject = interpolateTemplate(template.subject, variables)
    body = interpolateTemplate(template.body, variables)
  }

  const { html } = await sendEmail({
    to: submission.email,
    subject,
    react: <TemplateEmail body={body} preview={subject} />,
    text: body,
  })

  try {
    await db.insert(Email).values({
      id: generateId("eml"),
      organizationId: submission.production.organizationId,
      submissionId,
      sentByUserId: sentByUserId ?? null,
      toEmail: submission.email,
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

/**
 * Server action wrapper for client use (rejected/selected emails).
 * Requires authenticated casting director session.
 */
export const sendSubmissionEmailAction = secureActionClient
  .metadata({ action: "send-submission-email" })
  .inputSchema(
    z.object({
      submissionId: z.string().min(1),
      templateType: z.enum(["submissionReceived", "rejected", "selected"]),
      customSubject: z.string().optional(),
      customBody: z.string().optional(),
    }),
  )
  .action(
    async ({
      parsedInput: { submissionId, templateType, customSubject, customBody },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      // Verify the user's org owns this submission
      const submission = await db.query.Submission.findFirst({
        where: (s) => eq(s.id, submissionId),
        columns: { id: true },
        with: {
          role: {
            columns: { id: true },
            with: { production: { columns: { organizationId: true } } },
          },
        },
      })

      if (!submission || submission.role.production.organizationId !== orgId) {
        throw new Error("Submission not found.")
      }

      await sendSubmissionEmail(
        submissionId,
        templateType,
        customSubject,
        customBody,
        user.id,
      )
      return { success: true }
    },
  )
