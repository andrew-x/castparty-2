"use server"

import { and, eq, not } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { RESERVED_SLUGS } from "@/lib/slug"

export const updateProductionSlug = secureActionClient
  .metadata({ action: "update-production-slug" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      slug: z
        .string()
        .trim()
        .min(3, "URL ID must be at least 3 characters.")
        .max(60, "URL ID must be at most 60 characters.")
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Lowercase letters, numbers, and hyphens only.",
        )
        .refine((s) => !/^\d+$/.test(s), "URL ID cannot be purely numeric.")
        .refine((s) => !RESERVED_SLUGS.has(s), "This URL ID is reserved."),
    }),
  )
  .action(async ({ parsedInput: { productionId, slug }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) {
      throw new Error("No active organization.")
    }

    const production = await db.query.Production.findFirst({
      where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
      columns: { id: true, organizationId: true },
    })

    if (!production) {
      throw new Error("Production not found.")
    }

    const conflict = await db.query.Production.findFirst({
      where: (p) =>
        and(
          eq(p.organizationId, production.organizationId),
          eq(p.slug, slug),
          not(eq(p.id, productionId)),
        ),
      columns: { id: true },
    })

    if (conflict) {
      throw new Error("This URL ID is already taken.")
    }

    await db
      .update(Production)
      .set({ slug })
      .where(eq(Production.id, productionId))

    return { success: true }
  })
