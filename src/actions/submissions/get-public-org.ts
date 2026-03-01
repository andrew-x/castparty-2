"use server"

import { eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicOrg(orgId: string) {
  return (
    (await db.query.organization.findFirst({
      where: (o) => eq(o.id, orgId),
      columns: { id: true, name: true },
    })) ?? null
  )
}
