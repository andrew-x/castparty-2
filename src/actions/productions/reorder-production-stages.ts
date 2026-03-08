"use server"

import { and, eq, inArray, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { PipelineStage } from "@/lib/db/schema"

export const reorderProductionStages = secureActionClient
  .metadata({ action: "reorder-production-stages" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      stageIds: z.array(z.string().min(1)).min(1),
    }),
  )
  .action(
    async ({ parsedInput: { productionId, stageIds }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      // Verify the production belongs to the user's organization
      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true },
      })
      if (!production) throw new Error("Production not found.")

      // Verify all stages are CUSTOM template stages for this production
      const stages = await db.query.PipelineStage.findMany({
        where: (s) =>
          and(
            eq(s.productionId, productionId),
            isNull(s.roleId),
            eq(s.type, "CUSTOM"),
            inArray(s.id, stageIds),
          ),
        columns: { id: true },
      })

      if (stages.length !== stageIds.length) {
        throw new Error("Some stages were not found.")
      }

      // Update order values sequentially (1, 2, 3...)
      await Promise.all(
        stageIds.map((id, index) =>
          db
            .update(PipelineStage)
            .set({ order: index + 1 })
            .where(eq(PipelineStage.id, id)),
        ),
      )

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
