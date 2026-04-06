"use server"

import { eq } from "drizzle-orm"
import {
  type SubmissionEmailData,
  sendSubmissionEmail,
} from "@/actions/submissions/send-email-impl"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { customEmailActionSchema } from "@/lib/schemas/custom-email"

export const sendCustomEmailAction = secureActionClient
  .metadata({ action: "send-custom-email" })
  .inputSchema(customEmailActionSchema)
  .action(
    async ({ parsedInput: { submissionId, subject, body }, ctx: { user } }) => {
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

      await sendSubmissionEmail(submissionId, null, subject, body, user.id, {
        candidate: submission.candidate,
        role: submission.role,
        production: submission.production as SubmissionEmailData["production"],
      })
      return { success: true }
    },
  )
