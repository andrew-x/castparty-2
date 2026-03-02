"use server"

import { and, eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicRole(productionId: string, roleSlug: string) {
  const role = await db.query.Role.findFirst({
    where: (r) => and(eq(r.productionId, productionId), eq(r.slug, roleSlug)),
    with: { production: true },
  })
  return role ?? null
}
