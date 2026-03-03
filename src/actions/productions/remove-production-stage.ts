"use server"

import { and, eq, isNull } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { PipelineStage, Production } from "@/lib/db/schema"

export const removeProductionStage = secureActionClient
  .metadata({ action: "remove-production-stage" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      stageId: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput: { productionId, stageId }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    // Verify the production belongs to the user's organization
    const production = await db.query.Production.findFirst({
      where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
      columns: { id: true },
    })
    if (!production) throw new Error("Production not found.")

    // Verify this is a CUSTOM template stage (not a system stage)
    const stage = await db.query.PipelineStage.findFirst({
      where: (s) =>
        and(
          eq(s.id, stageId),
          eq(s.productionId, productionId),
          isNull(s.roleId),
          eq(s.type, "CUSTOM"),
        ),
      columns: { id: true },
    })

    if (!stage) throw new Error("Stage not found or cannot be removed.")

    await db.delete(PipelineStage).where(eq(PipelineStage.id, stageId))

    return { success: true }
  })
