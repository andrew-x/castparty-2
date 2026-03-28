"use server"

import { eq } from "drizzle-orm"
import { adminActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Email } from "@/lib/db/schema"
import { simulateInboundEmailFormSchema } from "@/lib/schemas/simulate-inbound-email"
import { generateId } from "@/lib/util"

export const simulateInboundEmailAction = adminActionClient
  .metadata({ action: "simulate-inbound-email" })
  .inputSchema(simulateInboundEmailFormSchema)
  .action(async ({ parsedInput }) => {
    const submission = await db.query.Submission.findFirst({
      where: (s) => eq(s.id, parsedInput.submissionId),
      columns: { id: true },
      with: {
        role: {
          columns: { id: true },
          with: { production: { columns: { organizationId: true } } },
        },
      },
    })

    if (!submission) throw new Error("Submission not found.")

    const inboundDomain =
      process.env.INBOUND_EMAIL_DOMAIN ?? "inbound.joincastparty.com"

    await db.insert(Email).values({
      id: generateId("eml"),
      organizationId: submission.role.production.organizationId,
      submissionId: parsedInput.submissionId,
      sentByUserId: null,
      direction: "inbound",
      fromEmail: parsedInput.fromEmail,
      toEmail: `reply+${parsedInput.submissionId}@${inboundDomain}`,
      subject: parsedInput.subject,
      bodyText: parsedInput.bodyText,
      bodyHtml: parsedInput.bodyText,
      templateType: null,
    })

    return { success: true }
  })
