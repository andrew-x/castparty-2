"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { PipelineUpdate, Submission } from "@/lib/db/schema"
import { updateSubmissionStatusSchema } from "@/lib/schemas/submission"
import { generateId } from "@/lib/util"

export const updateSubmissionStatus = secureActionClient
  .metadata({ action: "update-submission-status" })
  .inputSchema(updateSubmissionStatusSchema)
  .action(
    async ({
      parsedInput: { submissionId, stageId, rejectionReason },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      // Load submission with its role's production for ownership check
      const submission = await db.query.Submission.findFirst({
        where: (s) => eq(s.id, submissionId),
        columns: { id: true, roleId: true, stageId: true, productionId: true },
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
        where: (s) =>
          and(eq(s.id, stageId), eq(s.productionId, submission.productionId)),
        columns: { id: true, type: true },
      })

      if (!targetStage) {
        throw new Error("Invalid pipeline stage.")
      }

      // Store rejection reason when moving to REJECTED, clear when moving away
      const reason =
        targetStage.type === "REJECTED" ? (rejectionReason ?? null) : null

      await db.transaction(async (tx) => {
        await tx
          .update(Submission)
          .set({ stageId, rejectionReason: reason, updatedAt: day().toDate() })
          .where(eq(Submission.id, submissionId))

        await tx.insert(PipelineUpdate).values({
          id: generateId("pu"),
          organizationId: orgId,
          productionId: submission.productionId,
          roleId: submission.roleId,
          submissionId,
          fromStage: submission.stageId,
          toStage: stageId,
          changeByUserId: user.id,
        })
      })

      revalidatePath("/", "layout")
      return { id: submissionId }
    },
  )
