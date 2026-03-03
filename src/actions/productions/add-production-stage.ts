"use server"

import { and, eq, isNull } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { PipelineStage, Production } from "@/lib/db/schema"
import { generateId } from "@/lib/util"

export const addProductionStage = secureActionClient
  .metadata({ action: "add-production-stage" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      name: z.string().trim().min(1, "Stage name is required.").max(100),
    }),
  )
  .action(async ({ parsedInput: { productionId, name }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    // Verify the production belongs to the user's organization
    const production = await db.query.Production.findFirst({
      where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
      columns: { id: true },
    })
    if (!production) throw new Error("Production not found.")

    // Find current max order of custom stages for this production template
    const existing = await db.query.PipelineStage.findMany({
      where: (s) =>
        and(
          eq(s.productionId, productionId),
          isNull(s.roleId),
          eq(s.type, "CUSTOM"),
        ),
      columns: { order: true },
    })

    const maxOrder = existing.reduce((max, s) => Math.max(max, s.order), 0)

    const id = generateId("stg")
    await db.insert(PipelineStage).values({
      id,
      organizationId: orgId,
      productionId,
      roleId: null,
      name,
      order: maxOrder + 1,
      type: "CUSTOM",
    })

    return { id }
  })
