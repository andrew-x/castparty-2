"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"

export const toggleProductionOpen = secureActionClient
  .metadata({ action: "toggle-production-open" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      isOpen: z.boolean(),
    }),
  )
  .action(async ({ parsedInput: { productionId, isOpen }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    const production = await db.query.Production.findFirst({
      where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
      columns: { id: true },
    })
    if (!production) throw new Error("Production not found.")

    await db
      .update(Production)
      .set({ isOpen })
      .where(eq(Production.id, productionId))

    return { success: true }
  })
