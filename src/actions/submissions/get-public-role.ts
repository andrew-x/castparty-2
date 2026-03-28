"use server"

import { and, eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicRole(productionId: string, roleSlug: string) {
  const role = await db.query.Role.findFirst({
    where: (r) => and(eq(r.productionId, productionId), eq(r.slug, roleSlug)),
    with: {
      production: {
        columns: {
          id: true,
          name: true,
          status: true,
          organizationId: true,
          submissionFormFields: true,
          systemFieldConfig: true,
        },
      },
    },
  })
  if (!role || role.status !== "open" || role.production.status !== "open")
    return null
  return role
}
