"use server"

import { count, desc, eq, sql } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { PipelineStage, Production, Role, Submission } from "@/lib/db/schema"

export interface DashboardProduction {
  id: string
  name: string
  status: "open" | "closed" | "archive"
  createdAt: Date
  roleCount: number
  openRoleCount: number
  closedRoleCount: number
  archivedRoleCount: number
  appliedCount: number
  inReviewCount: number
  selectedCount: number
  rejectedCount: number
}

export async function getDashboardProductions(): Promise<
  DashboardProduction[]
> {
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

  const openRoleSq = db
    .select({
      productionId: Role.productionId,
      count: count().as("open_role_count"),
    })
    .from(Role)
    .where(eq(Role.status, "open"))
    .groupBy(Role.productionId)
    .as("open_roles")

  const closedRoleSq = db
    .select({
      productionId: Role.productionId,
      count: count().as("closed_role_count"),
    })
    .from(Role)
    .where(eq(Role.status, "closed"))
    .groupBy(Role.productionId)
    .as("closed_roles")

  const archivedRoleSq = db
    .select({
      productionId: Role.productionId,
      count: count().as("archived_role_count"),
    })
    .from(Role)
    .where(eq(Role.status, "archive"))
    .groupBy(Role.productionId)
    .as("archived_roles")

  const appliedSq = db
    .select({
      productionId: Submission.productionId,
      count: count().as("applied_count"),
    })
    .from(Submission)
    .innerJoin(PipelineStage, eq(Submission.stageId, PipelineStage.id))
    .where(eq(PipelineStage.type, "APPLIED"))
    .groupBy(Submission.productionId)
    .as("applied")

  const inReviewSq = db
    .select({
      productionId: Submission.productionId,
      count: count().as("in_review_count"),
    })
    .from(Submission)
    .innerJoin(PipelineStage, eq(Submission.stageId, PipelineStage.id))
    .where(eq(PipelineStage.type, "CUSTOM"))
    .groupBy(Submission.productionId)
    .as("in_review")

  const selectedSq = db
    .select({
      productionId: Submission.productionId,
      count: count().as("selected_count"),
    })
    .from(Submission)
    .innerJoin(PipelineStage, eq(Submission.stageId, PipelineStage.id))
    .where(eq(PipelineStage.type, "SELECTED"))
    .groupBy(Submission.productionId)
    .as("selected")

  const rejectedSq = db
    .select({
      productionId: Submission.productionId,
      count: count().as("rejected_count"),
    })
    .from(Submission)
    .innerJoin(PipelineStage, eq(Submission.stageId, PipelineStage.id))
    .where(eq(PipelineStage.type, "REJECTED"))
    .groupBy(Submission.productionId)
    .as("rejected")

  const rows = await db
    .select({
      id: Production.id,
      name: Production.name,
      status: Production.status,
      createdAt: Production.createdAt,
      roleCount: sql<number>`coalesce(${roleCountSq.count}, 0)`,
      openRoleCount: sql<number>`coalesce(${openRoleSq.count}, 0)`,
      closedRoleCount: sql<number>`coalesce(${closedRoleSq.count}, 0)`,
      archivedRoleCount: sql<number>`coalesce(${archivedRoleSq.count}, 0)`,
      appliedCount: sql<number>`coalesce(${appliedSq.count}, 0)`,
      inReviewCount: sql<number>`coalesce(${inReviewSq.count}, 0)`,
      selectedCount: sql<number>`coalesce(${selectedSq.count}, 0)`,
      rejectedCount: sql<number>`coalesce(${rejectedSq.count}, 0)`,
    })
    .from(Production)
    .leftJoin(roleCountSq, eq(roleCountSq.productionId, Production.id))
    .leftJoin(openRoleSq, eq(openRoleSq.productionId, Production.id))
    .leftJoin(closedRoleSq, eq(closedRoleSq.productionId, Production.id))
    .leftJoin(archivedRoleSq, eq(archivedRoleSq.productionId, Production.id))
    .leftJoin(appliedSq, eq(appliedSq.productionId, Production.id))
    .leftJoin(inReviewSq, eq(inReviewSq.productionId, Production.id))
    .leftJoin(selectedSq, eq(selectedSq.productionId, Production.id))
    .leftJoin(rejectedSq, eq(rejectedSq.productionId, Production.id))
    .where(eq(Production.organizationId, orgId))
    .orderBy(
      sql`CASE WHEN ${Production.status} = 'open' THEN 0 WHEN ${Production.status} = 'closed' THEN 1 ELSE 2 END`,
      desc(Production.createdAt),
    )

  return rows as DashboardProduction[]
}
