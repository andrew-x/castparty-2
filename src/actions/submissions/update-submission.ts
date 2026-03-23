"use server"

import { and, eq, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Candidate, Submission } from "@/lib/db/schema"
import { updateSubmissionContactSchema } from "@/lib/schemas/submission"

export const updateSubmission = secureActionClient
  .metadata({ action: "update-submission" })
  .inputSchema(updateSubmissionContactSchema)
  .action(
    async ({
      parsedInput: {
        submissionId,
        firstName,
        lastName,
        email,
        phone,
        location,
        links,
      },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const submission = await db.query.Submission.findFirst({
        where: (s) => eq(s.id, submissionId),
        columns: { id: true, candidateId: true },
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

      await db.transaction(async (tx) => {
        // Update this submission
        await tx
          .update(Submission)
          .set({
            firstName,
            lastName,
            email,
            phone: phone ?? "",
            location: location ?? "",
            links,
          })
          .where(eq(Submission.id, submissionId))

        // Update the candidate record
        await tx
          .update(Candidate)
          .set({
            firstName,
            lastName,
            email,
            phone: phone ?? "",
            location: location ?? "",
          })
          .where(eq(Candidate.id, submission.candidateId))

        // Cascade contact info to all other submissions for this candidate
        await tx
          .update(Submission)
          .set({
            firstName,
            lastName,
            email,
            phone: phone ?? "",
            location: location ?? "",
          })
          .where(
            and(
              eq(Submission.candidateId, submission.candidateId),
              ne(Submission.id, submissionId),
            ),
          )
      })

      revalidatePath("/", "layout")
      return { id: submissionId }
    },
  )
