"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"

export const updateProductionRejectReasons = secureActionClient
  .metadata({ action: "update-production-reject-reasons" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      rejectReasons: z.array(z.string().trim().min(1).max(200)).max(50),
    }),
  )
  .action(
    async ({ parsedInput: { productionId, rejectReasons }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true },
      })
      if (!production) throw new Error("Production not found.")

      await db
        .update(Production)
        .set({ rejectReasons })
        .where(eq(Production.id, productionId))

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
