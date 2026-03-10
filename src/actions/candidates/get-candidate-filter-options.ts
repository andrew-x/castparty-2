"use server"

import { desc, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"

export async function getCandidateFilterOptions() {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return []

  return db.query.Production.findMany({
    where: eq(Production.organizationId, orgId),
    columns: { id: true, name: true },
    orderBy: desc(Production.createdAt),
    with: {
      roles: {
        columns: { id: true, name: true },
      },
    },
  })
}
