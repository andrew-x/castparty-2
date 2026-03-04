"use server"

import { and, desc, eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicProductions(orgId: string) {
  return db.query.Production.findMany({
    where: (p) => and(eq(p.organizationId, orgId), eq(p.isOpen, true)),
    orderBy: (p) => desc(p.createdAt),
    with: { roles: true },
  })
}
