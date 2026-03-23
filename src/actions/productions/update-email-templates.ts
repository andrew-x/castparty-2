"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { updateEmailTemplatesActionSchema } from "@/lib/schemas/email-template"

export const updateEmailTemplates = secureActionClient
  .metadata({ action: "update-email-templates" })
  .inputSchema(updateEmailTemplatesActionSchema)
  .action(
    async ({
      parsedInput: { productionId, emailTemplates },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true },
      })
      if (!production) throw new Error("Production not found.")

      await db
        .update(Production)
        .set({ emailTemplates })
        .where(eq(Production.id, productionId))

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
