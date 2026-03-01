"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getRolesWithSubmissions(productionId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  const production = await db.query.Production.findFirst({
    where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
    columns: { id: true },
  })
  if (!production) return []

  return db.query.Role.findMany({
    where: (r) => eq(r.productionId, productionId),
    with: {
      submissions: {
        with: {
          candidate: true,
        },
      },
    },
  })
}
