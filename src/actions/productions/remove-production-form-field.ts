"use server"

import { and, eq } from "drizzle-orm"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { removeProductionFormFieldSchema } from "@/lib/schemas/form-fields"

export const removeProductionFormField = secureActionClient
  .metadata({ action: "remove-production-form-field" })
  .inputSchema(removeProductionFormFieldSchema)
  .action(async ({ parsedInput: { productionId, fieldId }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    const production = await db.query.Production.findFirst({
      where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
      columns: { id: true, formFields: true },
    })
    if (!production) throw new Error("Production not found.")

    const exists = production.formFields.some((f) => f.id === fieldId)
    if (!exists) throw new Error("Field not found.")

    await db
      .update(Production)
      .set({
        formFields: production.formFields.filter((f) => f.id !== fieldId),
      })
      .where(eq(Production.id, productionId))

    return { success: true }
  })
