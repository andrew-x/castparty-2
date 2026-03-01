"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { StatusChange, Submission } from "@/lib/db/schema"
import { generateId } from "@/lib/util"

export const updateSubmissionStatus = secureActionClient
  .metadata({ action: "update-submission-status" })
  .inputSchema(
    z.object({
      submissionId: z.string().min(1),
      stageId: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput: { submissionId, stageId }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    // Load submission with its role's production for ownership check
    const submission = await db.query.Submission.findFirst({
      where: (s) => eq(s.id, submissionId),
      columns: { id: true, roleId: true, stageId: true },
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

    // Verify the target stage belongs to the same role
    const targetStage = await db.query.PipelineStage.findFirst({
      where: (s) => and(eq(s.id, stageId), eq(s.roleId, submission.roleId)),
      columns: { id: true },
    })

    if (!targetStage) {
      throw new Error("Invalid pipeline stage.")
    }

    await db
      .update(Submission)
      .set({ stageId, updatedAt: new Date() })
      .where(eq(Submission.id, submissionId))

    await db.insert(StatusChange).values({
      id: generateId("sc"),
      submissionId,
      fromStageId: submission.stageId,
      toStageId: stageId,
      changedById: user.id,
    })

    return { id: submissionId }
  })
