"use server"

import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import {
  type SubmissionEmailData,
  sendSubmissionEmail,
} from "@/actions/submissions/send-email-impl"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"

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

      // Verify the user's org owns this submission and fetch all data needed
      // for sending the email in a single query
      const submission = await db.query.Submission.findFirst({
        where: (s) => eq(s.id, submissionId),
        columns: { id: true },
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
      })

      if (!submission || submission.production.organizationId !== orgId) {
        throw new Error("Submission not found.")
      }

      await sendSubmissionEmail(
        submissionId,
        templateType,
        customSubject,
        customBody,
        user.id,
        {
          candidate: submission.candidate,
          role: submission.role,
          production:
            submission.production as SubmissionEmailData["production"],
        },
      )
      return { success: true }
    },
  )
