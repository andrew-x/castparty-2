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
    const match = parsedInput.toEmail.match(/^reply\+([^@]+)@/)
    if (!match) throw new Error("Invalid reply address format.")
    const submissionId = match[1]

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

    if (!submission) throw new Error("Submission not found.")

    await db.insert(Email).values({
      id: generateId("eml"),
      organizationId: submission.role.production.organizationId,
      submissionId,
      sentByUserId: null,
      direction: "inbound",
      fromEmail: parsedInput.fromEmail,
      toEmail: parsedInput.toEmail,
      subject: parsedInput.subject,
      bodyText: parsedInput.bodyText,
      bodyHtml: parsedInput.bodyText,
      templateType: null,
    })

    return { success: true }
  })
