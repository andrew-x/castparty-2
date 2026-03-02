"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { PipelineStage, Submission } from "@/lib/db/schema"

export const removePipelineStage = secureActionClient
  .metadata({ action: "remove-pipeline-stage" })
  .inputSchema(
    z.object({
      stageId: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput: { stageId }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    // Load the stage with ownership chain
    const stage = await db.query.PipelineStage.findFirst({
      where: (s) => eq(s.id, stageId),
      columns: { id: true, roleId: true, type: true },
      with: {
        role: {
          columns: { id: true },
          with: {
            production: { columns: { organizationId: true } },
          },
        },
      },
    })

    if (!stage || stage.role.production.organizationId !== orgId) {
      throw new Error("Stage not found.")
    }

    if (stage.type !== "CUSTOM") {
      throw new Error("System stages cannot be removed.")
    }

    // Find the APPLIED stage for this role to reassign submissions
    const appliedStage = await db.query.PipelineStage.findFirst({
      where: (s) => and(eq(s.roleId, stage.roleId), eq(s.type, "APPLIED")),
      columns: { id: true },
    })

    if (!appliedStage) {
      throw new Error("Applied stage not found for this role.")
    }

    // Move submissions on this stage to the applied stage
    await db
      .update(Submission)
      .set({ stageId: appliedStage.id, updatedAt: day().toDate() })
      .where(eq(Submission.stageId, stageId))

    await db.delete(PipelineStage).where(eq(PipelineStage.id, stageId))

    return { success: true }
  })
