"use server"

import { createElement } from "react"
import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Email } from "@/lib/db/schema"
import { sendBatchEmail } from "@/lib/email"
import { interpolateTemplate } from "@/lib/email-template"
import { TemplateEmail } from "@/lib/emails/template-email"
import logger from "@/lib/logger"
import { bulkEmailActionSchema } from "@/lib/schemas/bulk-email"
import { generateId } from "@/lib/util"

export const bulkSendEmailAction = secureActionClient
  .metadata({ action: "bulk-send-email" })
  .inputSchema(bulkEmailActionSchema)
  .action(
    async ({
      parsedInput: { submissionIds: rawIds, subject, body },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const submissionIds = [...new Set(rawIds)]

      const submissions = await db.query.Submission.findMany({
        where: (s) => inArray(s.id, submissionIds),
        columns: { id: true },
        with: {
          candidate: {
            columns: { firstName: true, lastName: true, email: true },
          },
          role: { columns: { name: true } },
          production: {
            columns: { name: true, organizationId: true },
            with: { organization: { columns: { name: true } } },
          },
        },
      })

      if (submissions.length !== submissionIds.length) {
        throw new Error("Submission not found.")
      }

      const unauthorized = submissions.some(
        (s) => s.production.organizationId !== orgId,
      )
      if (unauthorized) {
        throw new Error("Submission not found.")
      }

      const inboundDomain =
        process.env.INBOUND_EMAIL_DOMAIN ?? "inbound.joincastparty.com"

      const emailPayloads = submissions.map((s) => {
        const variables = {
          first_name: s.candidate.firstName,
          last_name: s.candidate.lastName,
          production_name: s.production.name,
          role_name: s.role.name,
          organization_name: s.production.organization.name,
        }

        const interpolatedSubject = interpolateTemplate(subject, variables)
        const interpolatedBody = interpolateTemplate(body, variables)
        const replyTo = `reply+${s.id}@${inboundDomain}`

        return {
          submissionId: s.id,
          to: s.candidate.email,
          subject: interpolatedSubject,
          body: interpolatedBody,
          replyTo,
        }
      })

      const results = await sendBatchEmail(
        emailPayloads.map((e) => ({
          to: e.to,
          subject: e.subject,
          react: createElement(TemplateEmail, {
            body: e.body,
            preview: e.subject,
            replyTo: e.replyTo,
          }),
          text: `${e.body}\n\n---\nTo respond, just reply to this email or send a message to ${e.replyTo}`,
          replyTo: e.replyTo,
        })),
      )

      try {
        await db.insert(Email).values(
          emailPayloads.map((e, i) => ({
            id: generateId("eml"),
            organizationId: orgId,
            submissionId: e.submissionId,
            sentByUserId: user.id,
            direction: "outbound" as const,
            toEmail: e.to,
            subject: e.subject,
            bodyText: e.body,
            bodyHtml: results[i].html,
            templateType: null,
          })),
        )
      } catch (error) {
        logger.error(
          "[Email] Batch sent successfully but failed to save records",
          error,
        )
        throw new Error(
          "Emails were sent successfully but could not be saved to the activity log. No need to resend.",
        )
      }

      revalidatePath("/", "layout")
      return { sent: submissions.length }
    },
  )
