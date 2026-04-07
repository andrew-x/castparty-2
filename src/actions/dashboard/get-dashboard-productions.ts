"use server"

import { count, eq } from "drizzle-orm"
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

  // Fetch productions, role counts by status, and submission counts by stage type
  // using 3 queries instead of 8 subqueries
  const [productions, roleCounts, submissionCounts] = await Promise.all([
    db.query.Production.findMany({
      where: (p, { eq }) => eq(p.organizationId, orgId),
      orderBy: (p, { desc }) => desc(p.createdAt),
      columns: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    }),
    db
      .select({
        productionId: Role.productionId,
        status: Role.status,
        count: count().as("count"),
      })
      .from(Role)
      .innerJoin(Production, eq(Role.productionId, Production.id))
      .where(eq(Production.organizationId, orgId))
      .groupBy(Role.productionId, Role.status),
    db
      .select({
        productionId: Submission.productionId,
        stageType: PipelineStage.type,
        count: count().as("count"),
      })
      .from(Submission)
      .innerJoin(PipelineStage, eq(Submission.stageId, PipelineStage.id))
      .innerJoin(Production, eq(Submission.productionId, Production.id))
      .where(eq(Production.organizationId, orgId))
      .groupBy(Submission.productionId, PipelineStage.type),
  ])

  // Build lookup maps
  const roleMap = new Map<
    string,
    { total: number; open: number; closed: number; archived: number }
  >()
  for (const r of roleCounts) {
    const entry = roleMap.get(r.productionId) ?? {
      total: 0,
      open: 0,
      closed: 0,
      archived: 0,
    }
    entry.total += r.count
    if (r.status === "open") entry.open += r.count
    else if (r.status === "closed") entry.closed += r.count
    else if (r.status === "archive") entry.archived += r.count
    roleMap.set(r.productionId, entry)
  }

  const stageMap = new Map<
    string,
    { applied: number; inReview: number; selected: number; rejected: number }
  >()
  for (const s of submissionCounts) {
    const entry = stageMap.get(s.productionId) ?? {
      applied: 0,
      inReview: 0,
      selected: 0,
      rejected: 0,
    }
    if (s.stageType === "APPLIED") entry.applied += s.count
    else if (s.stageType === "CUSTOM") entry.inReview += s.count
    else if (s.stageType === "SELECTED") entry.selected += s.count
    else if (s.stageType === "REJECTED") entry.rejected += s.count
    stageMap.set(s.productionId, entry)
  }

  // Assemble and sort: open first, then closed, then archived
  const result: DashboardProduction[] = productions.map((p) => {
    const roles = roleMap.get(p.id) ?? {
      total: 0,
      open: 0,
      closed: 0,
      archived: 0,
    }
    const stages = stageMap.get(p.id) ?? {
      applied: 0,
      inReview: 0,
      selected: 0,
      rejected: 0,
    }
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      createdAt: p.createdAt,
      roleCount: roles.total,
      openRoleCount: roles.open,
      closedRoleCount: roles.closed,
      archivedRoleCount: roles.archived,
      appliedCount: stages.applied,
      inReviewCount: stages.inReview,
      selectedCount: stages.selected,
      rejectedCount: stages.rejected,
    }
  })

  result.sort((a, b) => {
    const statusOrder = { open: 0, closed: 1, archive: 2 }
    const diff = statusOrder[a.status] - statusOrder[b.status]
    if (diff !== 0) return diff
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  return result
}
