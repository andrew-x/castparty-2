"use server"

import { and, eq, not } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { updateProductionActionSchema } from "@/lib/schemas/production"

export const updateProduction = secureActionClient
  .metadata({ action: "update-production" })
  .inputSchema(updateProductionActionSchema)
  .action(
    async ({
      parsedInput: { productionId, name, slug, location, status },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true, organizationId: true },
      })
      if (!production) throw new Error("Production not found.")

      const conflict = await db.query.Production.findFirst({
        where: (p) =>
          and(
            eq(p.organizationId, production.organizationId),
            eq(p.slug, slug),
            not(eq(p.id, productionId)),
          ),
        columns: { id: true },
      })
      if (conflict) throw new Error("This URL ID is already taken.")

      await db
        .update(Production)
        .set({
          name,
          slug,
          location,
          ...(status !== undefined && { status }),
        })
        .where(eq(Production.id, productionId))

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
