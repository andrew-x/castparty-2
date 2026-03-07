"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"

export const checkSlugAvailability = secureActionClient
  .metadata({ action: "check-slug-availability" })
  .inputSchema(z.object({ slug: z.string() }))
  .action(async ({ parsedInput: { slug }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) {
      throw new Error("No active organization.")
    }

    const existing = await db
      .select({ slug: Production.slug })
      .from(Production)
      .where(
        and(eq(Production.slug, slug), eq(Production.organizationId, orgId)),
      )
      .limit(1)

    return { available: existing.length === 0 }
  })
