"use server"

import { and, eq, lt, max } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import { MAX_PIPELINE_STAGES } from "@/lib/constants"
import db from "@/lib/db/db"
import { PipelineStage } from "@/lib/db/schema"
import { generateId } from "@/lib/util"

export const addPipelineStage = secureActionClient
  .metadata({ action: "add-pipeline-stage" })
  .inputSchema(
    z.object({
      roleId: z.string().min(1),
      name: z.string().trim().min(1, "Stage name is required.").max(50),
    }),
  )
  .action(async ({ parsedInput: { roleId, name }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    // Verify ownership chain: role → production → org
    const role = await db.query.Role.findFirst({
      where: (r) => eq(r.id, roleId),
      columns: { id: true, productionId: true },
      with: {
        production: { columns: { organizationId: true } },
      },
    })

    if (!role || role.production.organizationId !== orgId) {
      throw new Error("Role not found.")
    }

    // Enforce stage limit
    const allStages = await db.query.PipelineStage.findMany({
      where: (s) => eq(s.roleId, roleId),
      columns: { id: true },
    })
    if (allStages.length >= MAX_PIPELINE_STAGES) {
      throw new Error(
        `A role can have at most ${MAX_PIPELINE_STAGES} pipeline stages.`,
      )
    }

    // Calculate order: max order of non-terminal stages + 1
    const [result] = await db
      .select({ maxOrder: max(PipelineStage.order) })
      .from(PipelineStage)
      .where(
        and(eq(PipelineStage.roleId, roleId), lt(PipelineStage.order, 1000)),
      )

    const order = (result?.maxOrder ?? 0) + 1

    const id = generateId("stg")
    await db.insert(PipelineStage).values({
      id,
      roleId,
      productionId: role.productionId,
      organizationId: orgId,
      name,
      order,
      type: "CUSTOM",
    })

    return { id }
  })
