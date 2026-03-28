"use server"

import { and, eq, not } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getOrgRolesGroupedByProduction() {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  return db.query.Production.findMany({
    where: (p) =>
      and(eq(p.organizationId, orgId), not(eq(p.status, "archive"))),
    columns: { id: true, name: true },
    with: {
      roles: {
        columns: { id: true, name: true, productionId: true },
        where: (r) => not(eq(r.status, "archive")),
      },
    },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })
}
