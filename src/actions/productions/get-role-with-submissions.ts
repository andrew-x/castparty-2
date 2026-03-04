"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getRoleWithSubmissions(roleId: string) {
  const user = await checkAuth()
  const orgId = user.activeOrganizationId
  if (!orgId) return null

  const role = await db.query.Role.findFirst({
    where: (r) => eq(r.id, roleId),
    with: {
      production: {
        columns: { id: true, organizationId: true },
      },
      pipelineStages: {
        orderBy: (s, { asc }) => [asc(s.order)],
      },
      submissions: {
        with: {
          candidate: true,
          stage: true,
        },
      },
    },
  })

  if (!role || role.production.organizationId !== orgId) return null

  return role
}
