"use server"

import { and, eq, ne } from "drizzle-orm"
import { generateKeyBetween } from "fractional-indexing"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { File, Submission } from "@/lib/db/schema"
import { copySubmissionActionSchema } from "@/lib/schemas/submission"
import { generateId } from "@/lib/util"

export const copySubmissionToRole = secureActionClient
  .metadata({ action: "copy-submission-to-role" })
  .inputSchema(copySubmissionActionSchema)
  .action(
    async ({ parsedInput: { submissionId, targetRoleId }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      // Load source submission with files and ownership chain
      const source = await db.query.Submission.findFirst({
        where: (s) => eq(s.id, submissionId),
        with: {
          role: {
            columns: { id: true },
            with: {
              production: { columns: { organizationId: true } },
            },
          },
          files: true,
        },
      })

      if (!source || source.role.production.organizationId !== orgId) {
        throw new Error("Submission not found.")
      }

      if (targetRoleId === source.roleId) {
        throw new Error("Submission is already in this role.")
      }

      // Verify target role belongs to same org
      const targetRole = await db.query.Role.findFirst({
        where: (r) => eq(r.id, targetRoleId),
        with: {
          production: { columns: { id: true, organizationId: true } },
        },
        columns: { id: true, productionId: true },
      })

      if (!targetRole || targetRole.production.organizationId !== orgId) {
        throw new Error("Target role not found.")
      }

      // Guard against duplicate: same candidate already has a submission for target role
      const existing = await db.query.Submission.findFirst({
        where: (s) =>
          and(
            eq(s.candidateId, source.candidateId),
            eq(s.roleId, targetRoleId),
          ),
        columns: { id: true },
      })
      if (existing) {
        throw new Error(
          "This candidate already has a submission for the selected role.",
        )
      }

      // Find the APPLIED stage for the target role
      const appliedStage = await db.query.PipelineStage.findFirst({
        where: (s) =>
          and(
            eq(s.productionId, targetRole.productionId),
            eq(s.type, "APPLIED"),
          ),
        columns: { id: true },
      })

      if (!appliedStage) {
        throw new Error("Target role's pipeline is not configured.")
      }

      const firstInApplied = await db.query.Submission.findFirst({
        where: (s) =>
          and(
            eq(s.productionId, targetRole.productionId),
            eq(s.stageId, appliedStage.id),
            ne(s.sortOrder, ""),
          ),
        columns: { sortOrder: true },
        orderBy: (s, { asc }) => [asc(s.sortOrder), asc(s.createdAt)],
      })

      const sortOrder = generateKeyBetween(
        null,
        firstInApplied?.sortOrder || null,
      )

      // Create new submission + copy file records atomically
      const newSubmissionId = generateId("sub")

      await db.transaction(async (tx) => {
        await tx.insert(Submission).values({
          id: newSubmissionId,
          productionId: targetRole.productionId,
          roleId: targetRoleId,
          candidateId: source.candidateId,
          stageId: appliedStage.id,
          sortOrder,
          answers: source.answers,
          links: source.links,
          videoUrl: source.videoUrl,
          unionStatus: source.unionStatus,
          representation: source.representation,
          resumeText: source.resumeText,
        })

        if (source.files.length > 0) {
          await tx.insert(File).values(
            source.files.map((f) => ({
              id: generateId("file"),
              submissionId: newSubmissionId,
              type: f.type,
              formFieldId: f.formFieldId,
              url: f.url,
              key: f.key,
              path: f.path,
              filename: f.filename,
              contentType: f.contentType,
              size: f.size,
              order: f.order,
            })),
          )
        }
      })

      revalidatePath("/", "layout")

      return {
        newSubmissionId,
        targetProductionId: targetRole.productionId,
        targetRoleId,
      }
    },
  )
