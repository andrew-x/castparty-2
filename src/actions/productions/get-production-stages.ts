"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getProductionStages(productionId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  // Verify the production belongs to the user's organization
  const production = await db.query.Production.findFirst({
    where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
    columns: { id: true },
  })
  if (!production) return []

  return db.query.PipelineStage.findMany({
    where: (s) => eq(s.productionId, productionId),
    orderBy: (s) => s.order,
  })
}
