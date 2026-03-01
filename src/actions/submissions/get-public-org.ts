"use server"

import { eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicOrg(orgSlug: string) {
  return (
    (await db.query.organization.findFirst({
      where: (o) => eq(o.slug, orgSlug),
      columns: { id: true, name: true, slug: true },
    })) ?? null
  )
}
