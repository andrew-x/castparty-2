"use server"

import { eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicProduction(productionId: string) {
  return (
    (await db.query.Production.findFirst({
      where: (p) => eq(p.id, productionId),
      with: { roles: true },
    })) ?? null
  )
}
