"use server"

import { count, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { PipelineStage, Submission } from "@/lib/db/schema"

export async function getRoleStagesWithCounts(roleId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  const role = await db.query.Role.findFirst({
    where: (r) => eq(r.id, roleId),
    columns: { id: true },
    with: {
      production: { columns: { organizationId: true } },
    },
  })

  if (!role || role.production.organizationId !== orgId) return []

  const submissionCountSq = db
    .select({
      stageId: Submission.stageId,
      count: count().as("submission_count"),
    })
    .from(Submission)
    .groupBy(Submission.stageId)
    .as("sc")

  return db
    .select({
      id: PipelineStage.id,
      name: PipelineStage.name,
      order: PipelineStage.order,
      type: PipelineStage.type,
      submissionCount: submissionCountSq.count,
    })
    .from(PipelineStage)
    .leftJoin(
      submissionCountSq,
      eq(submissionCountSq.stageId, PipelineStage.id),
    )
    .where(eq(PipelineStage.roleId, roleId))
    .orderBy(PipelineStage.order)
}
