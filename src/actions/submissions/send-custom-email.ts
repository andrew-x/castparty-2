"use server"

import { eq } from "drizzle-orm"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { customEmailActionSchema } from "@/lib/schemas/custom-email"
import { sendSubmissionEmail } from "./send-submission-email"

export const sendCustomEmailAction = secureActionClient
  .metadata({ action: "send-custom-email" })
  .inputSchema(customEmailActionSchema)
  .action(
    async ({ parsedInput: { submissionId, subject, body }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

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

      await sendSubmissionEmail(submissionId, null, subject, body, user.id)
      return { success: true }
    },
  )
