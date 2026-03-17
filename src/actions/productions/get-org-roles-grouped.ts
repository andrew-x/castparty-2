"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getOrgRolesGroupedByProduction() {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  return db.query.Production.findMany({
    where: (p) => eq(p.organizationId, orgId),
    columns: { id: true, name: true },
    with: {
      roles: {
        columns: { id: true, name: true, productionId: true },
      },
    },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })
}
