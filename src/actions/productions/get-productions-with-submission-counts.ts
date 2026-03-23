"use server"

import { asc, count, desc, eq, sql } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Production, Role, Submission } from "@/lib/db/schema"

export async function getProductionsWithSubmissionCounts() {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  const roleCountSq = db
    .select({
      productionId: Role.productionId,
      count: count().as("role_count"),
    })
    .from(Role)
    .groupBy(Role.productionId)
    .as("rc")

  const submissionCountSq = db
    .select({
      productionId: Submission.productionId,
      count: count().as("submission_count"),
    })
    .from(Submission)
    .groupBy(Submission.productionId)
    .as("sc")

  return db
    .select({
      id: Production.id,
      name: Production.name,
      description: Production.description,
      isOpen: Production.isOpen,
      isArchived: Production.isArchived,
      createdAt: Production.createdAt,
      roleCount: sql<number>`coalesce(${roleCountSq.count}, 0)`,
      submissionCount: sql<number>`coalesce(${submissionCountSq.count}, 0)`,
    })
    .from(Production)
    .leftJoin(roleCountSq, eq(roleCountSq.productionId, Production.id))
    .leftJoin(
      submissionCountSq,
      eq(submissionCountSq.productionId, Production.id),
    )
    .where(eq(Production.organizationId, orgId))
    .orderBy(asc(Production.isArchived), desc(Production.createdAt))
}
