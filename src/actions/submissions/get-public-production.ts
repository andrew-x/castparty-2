"use server"

import { and, eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicProduction(
  orgId: string,
  productionSlug: string,
) {
  const production = await db.query.Production.findFirst({
    where: (p) => and(eq(p.organizationId, orgId), eq(p.slug, productionSlug)),
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      banner: true,
      status: true,
      submissionFormFields: true,
      systemFieldConfig: true,
    },
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
  if (!production || production.status !== "open") return null
  return production
}
