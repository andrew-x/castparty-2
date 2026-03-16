"use server"

import { count, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
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

    if (
      !stage ||
      !stage.role ||
      stage.role.production.organizationId !== orgId
    ) {
      throw new Error("Stage not found.")
    }

    if (stage.type !== "CUSTOM") {
      throw new Error("System stages cannot be removed.")
    }

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

    await db.delete(PipelineStage).where(eq(PipelineStage.id, stageId))

    revalidatePath("/", "layout")
    return { success: true }
  })
