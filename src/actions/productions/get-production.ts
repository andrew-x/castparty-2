"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getProduction(id: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return null

  return (
    (await db.query.Production.findFirst({
      where: (p) => and(eq(p.id, id), eq(p.organizationId, orgId)),
      with: {
        organization: {
          columns: { name: true, slug: true },
        },
      },
    })) ?? null
  )
}
