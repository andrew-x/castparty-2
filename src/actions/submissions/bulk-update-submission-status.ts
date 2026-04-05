"use server"

import { generateNKeysBetween } from "fractional-indexing"
import { and, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { PipelineUpdate, Submission } from "@/lib/db/schema"
import { bulkUpdateSubmissionStatusSchema } from "@/lib/schemas/submission"
import { generateId } from "@/lib/util"

export const bulkUpdateSubmissionStatus = secureActionClient
  .metadata({ action: "bulk-update-submission-status" })
  .inputSchema(bulkUpdateSubmissionStatusSchema)
  .action(
    async ({
      parsedInput: { submissionIds, stageId, rejectionReason },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      // Load all submissions with their role's production for ownership check
      const submissions = await db.query.Submission.findMany({
        where: (s) => inArray(s.id, submissionIds),
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

      // Verify all requested IDs were found and belong to this organization
      if (submissions.length !== submissionIds.length) {
        throw new Error("Submission not found.")
      }
      const unauthorized = submissions.some(
        (s) => s.role.production.organizationId !== orgId,
      )
      if (unauthorized) {
        throw new Error("Submission not found.")
      }

      // All submissions must belong to the same production
      const productionIds = new Set(submissions.map((s) => s.productionId))
      if (productionIds.size > 1) {
        throw new Error("All submissions must belong to the same production.")
      }

      // Verify the target stage belongs to the same production
      const targetStage = await db.query.PipelineStage.findFirst({
        where: (s) =>
          and(
            eq(s.id, stageId),
            eq(s.productionId, submissions[0].productionId),
          ),
        columns: { id: true, type: true },
      })

      if (!targetStage) {
        throw new Error("Invalid pipeline stage.")
      }

      // Skip submissions already at the target stage
      const toMove = submissions.filter((s) => s.stageId !== stageId)

      if (toMove.length === 0) {
        return { movedCount: 0 }
      }

      // Find the current last sortOrder in the target stage so bulk-moved
      // submissions are appended to the end of the column.
      const lastInStage = await db.query.Submission.findFirst({
        where: (s) =>
          and(
            eq(s.productionId, submissions[0].productionId),
            eq(s.stageId, stageId),
          ),
        columns: { sortOrder: true },
        orderBy: (s, { desc }) => [desc(s.sortOrder)],
      })

      const sortKeys = generateNKeysBetween(
        lastInStage?.sortOrder || null,
        null,
        toMove.length,
      )

      // Store rejection reason when moving to REJECTED, clear when moving away
      const reason =
        targetStage.type === "REJECTED" ? (rejectionReason ?? null) : null

      await db.transaction(async (tx) => {
        for (let i = 0; i < toMove.length; i++) {
          await tx
            .update(Submission)
            .set({
              stageId,
              rejectionReason: reason,
              sortOrder: sortKeys[i],
              updatedAt: day().toDate(),
            })
            .where(eq(Submission.id, toMove[i].id))
        }

        await tx.insert(PipelineUpdate).values(
          toMove.map((s) => ({
            id: generateId("pu"),
            organizationId: orgId,
            productionId: s.productionId,
            roleId: s.roleId,
            submissionId: s.id,
            fromStage: s.stageId,
            toStage: stageId,
            changeByUserId: user.id,
          })),
        )
      })

      revalidatePath("/", "layout")
      return { movedCount: toMove.length }
    },
  )
