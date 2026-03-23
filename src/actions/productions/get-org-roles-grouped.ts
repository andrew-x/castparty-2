"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getOrgRolesGroupedByProduction() {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  return db.query.Production.findMany({
    where: (p) => and(eq(p.organizationId, orgId), eq(p.isArchived, false)),
    columns: { id: true, name: true },
    with: {
      roles: {
        columns: { id: true, name: true, productionId: true },
        where: (r) => eq(r.isArchived, false),
      },
    },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })
}
