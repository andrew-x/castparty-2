"use server"

import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { PipelineStage } from "@/lib/db/schema"

export const reorderRoleStages = secureActionClient
  .metadata({ action: "reorder-role-stages" })
  .inputSchema(
    z.object({
      roleId: z.string().min(1),
      stageIds: z.array(z.string().min(1)).min(1),
    }),
  )
  .action(async ({ parsedInput: { roleId, stageIds }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    // Verify ownership chain: role → production → org
    const role = await db.query.Role.findFirst({
      where: (r) => eq(r.id, roleId),
      columns: { id: true },
      with: {
        production: { columns: { organizationId: true } },
      },
    })

    if (!role || role.production.organizationId !== orgId) {
      throw new Error("Role not found.")
    }

    // Verify all stages are CUSTOM stages for this role
    const stages = await db.query.PipelineStage.findMany({
      where: (s) =>
        and(
          eq(s.roleId, roleId),
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

    return { success: true }
  })
