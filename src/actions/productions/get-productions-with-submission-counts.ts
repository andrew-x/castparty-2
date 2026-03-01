"use server"

import { count, desc, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Production, Submission } from "@/lib/db/schema"

export async function getProductionsWithSubmissionCounts() {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  return db
    .select({
      id: Production.id,
      name: Production.name,
      description: Production.description,
      createdAt: Production.createdAt,
      submissionCount: count(Submission.id),
    })
    .from(Production)
    .leftJoin(Submission, eq(Submission.productionId, Production.id))
    .where(eq(Production.organizationId, orgId))
    .groupBy(Production.id)
    .orderBy(desc(Production.createdAt))
}
