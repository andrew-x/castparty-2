"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Candidate, File, Submission } from "@/lib/db/schema"
import { mergeCandidateActionSchema } from "@/lib/schemas/candidate"

export const mergeCandidate = secureActionClient
  .metadata({ action: "merge-candidate" })
  .inputSchema(mergeCandidateActionSchema)
  .action(
    async ({
      parsedInput: { sourceCandidateId, destinationCandidateId },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      if (sourceCandidateId === destinationCandidateId)
        throw new Error("Cannot merge a candidate into themselves.")

      const [source, destination] = await Promise.all([
        db.query.Candidate.findFirst({
          where: (c) =>
            and(eq(c.id, sourceCandidateId), eq(c.organizationId, orgId)),
          columns: { id: true },
        }),
        db.query.Candidate.findFirst({
          where: (c) =>
            and(eq(c.id, destinationCandidateId), eq(c.organizationId, orgId)),
          columns: { id: true },
        }),
      ])

      if (!source) throw new Error("Source candidate not found.")
      if (!destination) throw new Error("Destination candidate not found.")

      await db.transaction(async (tx) => {
        await tx
          .update(Submission)
          .set({ candidateId: destinationCandidateId })
          .where(eq(Submission.candidateId, sourceCandidateId))

        await tx
          .update(File)
          .set({ candidateId: destinationCandidateId })
          .where(eq(File.candidateId, sourceCandidateId))

        await tx
          .delete(Candidate)
          .where(
            and(
              eq(Candidate.id, sourceCandidateId),
              eq(Candidate.organizationId, orgId),
            ),
          )
      })

      revalidatePath("/", "layout")
      return { destinationCandidateId }
    },
  )
