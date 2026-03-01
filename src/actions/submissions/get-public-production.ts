"use server"

import { and, eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicProduction(
  orgId: string,
  productionSlug: string,
) {
  return (
    (await db.query.Production.findFirst({
      where: (p) =>
        and(eq(p.organizationId, orgId), eq(p.slug, productionSlug)),
      with: { roles: true },
    })) ?? null
  )
}
