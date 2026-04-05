"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Submission } from "@/lib/db/schema"
import { reorderSubmissionSchema } from "@/lib/schemas/submission"

export const reorderSubmission = secureActionClient
  .metadata({ action: "reorder-submission" })
  .inputSchema(reorderSubmissionSchema)
  .action(
    async ({ parsedInput: { submissionId, sortOrder }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const submission = await db.query.Submission.findFirst({
        where: (s) => eq(s.id, submissionId),
        columns: { id: true },
        with: {
          role: {
            columns: { id: true },
            with: {
              production: {
                columns: { organizationId: true },
              },
            },
          },
        },
      })

      if (!submission || submission.role.production.organizationId !== orgId) {
        throw new Error("Submission not found.")
      }

      await db
        .update(Submission)
        .set({ sortOrder })
        .where(eq(Submission.id, submissionId))

      revalidatePath("/", "layout")
      return { id: submissionId }
    },
  )
