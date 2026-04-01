"use server"

import { and, desc, eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicProductions(orgId: string) {
  return db.query.Production.findMany({
    where: (p) => and(eq(p.organizationId, orgId), eq(p.status, "open")),
    orderBy: (p) => desc(p.createdAt),
    with: {
      roles: {
        where: (r) => eq(r.status, "open"),
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          referencePhotos: true,
        },
      },
    },
  })
}
