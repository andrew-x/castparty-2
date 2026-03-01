"use server"

import { desc, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getProductions() {
  const user = await checkAuth()

  const orgId = user.activeOrganizationId
  if (!orgId) {
    return []
  }

  return db.query.Production.findMany({
    where: (p) => eq(p.organizationId, orgId),
    orderBy: (p) => desc(p.createdAt),
  })
}
