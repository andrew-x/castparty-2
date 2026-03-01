"use server"

import { desc, eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicProductions(orgId: string) {
  return db.query.Production.findMany({
    where: (p) => eq(p.organizationId, orgId),
    orderBy: (p) => desc(p.createdAt),
    with: { roles: true },
  })
}
