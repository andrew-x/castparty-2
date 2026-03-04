"use server"

import { and, eq } from "drizzle-orm"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { updateProductionFormFieldSchema } from "@/lib/schemas/form-fields"

export const updateProductionFormField = secureActionClient
  .metadata({ action: "update-production-form-field" })
  .inputSchema(updateProductionFormFieldSchema)
  .action(
    async ({
      parsedInput: { productionId, fieldId, ...updates },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true, formFields: true },
      })
      if (!production) throw new Error("Production not found.")

      const fieldIndex = production.formFields.findIndex(
        (f) => f.id === fieldId,
      )
      if (fieldIndex === -1) throw new Error("Field not found.")

      const field = production.formFields[fieldIndex]

      // Validate options for select/multiselect
      if (
        updates.options !== undefined &&
        (field.type === "SELECT" || field.type === "MULTISELECT") &&
        updates.options.length === 0
      ) {
        throw new Error("Select fields must have at least one option.")
      }

      const updated = [...production.formFields]
      updated[fieldIndex] = { ...field, ...updates }

      await db
        .update(Production)
        .set({ formFields: updated })
        .where(eq(Production.id, productionId))

      return { success: true }
    },
  )
