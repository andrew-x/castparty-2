"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"

export const checkSlugAvailability = secureActionClient
  .metadata({ action: "check-slug-availability" })
  .inputSchema(z.object({ slug: z.string() }))
  .action(async ({ parsedInput: { slug }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) {
      throw new Error("No active organization.")
    }

    const existing = await db.query.Production.findFirst({
      where: (p) => and(eq(p.slug, slug), eq(p.organizationId, orgId)),
      columns: { slug: true },
    })

    return { available: !existing }
  })
