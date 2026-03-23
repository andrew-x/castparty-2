"use server"

import { and, count, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Feedback, PipelineStage, Submission } from "@/lib/db/schema"

export const removeProductionStage = secureActionClient
  .metadata({ action: "remove-production-stage" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      stageId: z.string().min(1),
      force: z.boolean().optional(),
    }),
  )
  .action(
    async ({
      parsedInput: { productionId, stageId, force },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      // Verify the production belongs to the user's organization
      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true },
      })
      if (!production) throw new Error("Production not found.")

      // Verify this is a CUSTOM stage (not a system stage)
      const stage = await db.query.PipelineStage.findFirst({
        where: (s) =>
          and(
            eq(s.id, stageId),
            eq(s.productionId, productionId),
            eq(s.type, "CUSTOM"),
          ),
        columns: { id: true },
      })

      if (!stage) throw new Error("Stage not found or cannot be removed.")

      // Block deletion if submissions still exist on this stage
      const [{ value: submissionCount }] = await db
        .select({ value: count() })
        .from(Submission)
        .where(eq(Submission.stageId, stageId))

      if (submissionCount > 0) {
        throw new Error(
          "Move all submissions out of this stage before deleting it.",
        )
      }

      const [{ value: feedbackCount }] = await db
        .select({ value: count() })
        .from(Feedback)
        .where(eq(Feedback.stageId, stageId))

      if (feedbackCount > 0 && !force) {
        return { confirmRequired: true, feedbackCount }
      }

      await db.transaction(async (tx) => {
        if (feedbackCount > 0) {
          await tx.delete(Feedback).where(eq(Feedback.stageId, stageId))
        }

        await tx.delete(PipelineStage).where(eq(PipelineStage.id, stageId))
      })

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
