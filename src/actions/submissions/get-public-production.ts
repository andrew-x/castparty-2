"use server"

import { and, eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicProduction(
  orgId: string,
  productionSlug: string,
) {
  const production = await db.query.Production.findFirst({
    where: (p) => and(eq(p.organizationId, orgId), eq(p.slug, productionSlug)),
    with: { roles: true },
  })
  return production ?? null
}
