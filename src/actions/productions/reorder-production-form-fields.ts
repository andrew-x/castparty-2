"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { reorderProductionFormFieldsSchema } from "@/lib/schemas/form-fields"

export const reorderProductionFormFields = secureActionClient
  .metadata({ action: "reorder-production-form-fields" })
  .inputSchema(reorderProductionFormFieldsSchema)
  .action(
    async ({ parsedInput: { productionId, fieldIds }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true, formFields: true },
      })
      if (!production) throw new Error("Production not found.")

      const uniqueIds = new Set(fieldIds)
      if (
        uniqueIds.size !== fieldIds.length ||
        uniqueIds.size !== production.formFields.length
      ) {
        throw new Error("Field IDs must match existing fields exactly.")
      }

      const fieldMap = new Map(production.formFields.map((f) => [f.id, f]))
      const reordered = fieldIds.map((id) => {
        const field = fieldMap.get(id)
        if (!field) throw new Error("Field not found.")
        return field
      })

      await db
        .update(Production)
        .set({ formFields: reordered })
        .where(eq(Production.id, productionId))

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
