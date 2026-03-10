"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { updateProductionFeedbackFormFieldSchema } from "@/lib/schemas/form-fields"

export const updateProductionFeedbackFormField = secureActionClient
  .metadata({ action: "update-production-feedback-form-field" })
  .inputSchema(updateProductionFeedbackFormFieldSchema)
  .action(
    async ({
      parsedInput: { productionId, fieldId, ...updates },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true, feedbackFormFields: true },
      })
      if (!production) throw new Error("Production not found.")

      const fieldIndex = production.feedbackFormFields.findIndex(
        (f) => f.id === fieldId,
      )
      if (fieldIndex === -1) throw new Error("Field not found.")

      const field = production.feedbackFormFields[fieldIndex]

      // Validate options for select/checkbox group
      if (
        updates.options !== undefined &&
        (field.type === "SELECT" || field.type === "CHECKBOX_GROUP") &&
        updates.options.length === 0
      ) {
        throw new Error("Select fields must have at least one option.")
      }

      const updated = [...production.feedbackFormFields]
      updated[fieldIndex] = { ...field, ...updates }

      await db
        .update(Production)
        .set({ feedbackFormFields: updated })
        .where(eq(Production.id, productionId))

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
