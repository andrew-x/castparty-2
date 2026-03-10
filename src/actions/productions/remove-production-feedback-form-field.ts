"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { removeProductionFeedbackFormFieldSchema } from "@/lib/schemas/form-fields"

export const removeProductionFeedbackFormField = secureActionClient
  .metadata({ action: "remove-production-feedback-form-field" })
  .inputSchema(removeProductionFeedbackFormFieldSchema)
  .action(async ({ parsedInput: { productionId, fieldId }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    const production = await db.query.Production.findFirst({
      where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
      columns: { id: true, feedbackFormFields: true },
    })
    if (!production) throw new Error("Production not found.")

    const exists = production.feedbackFormFields.some((f) => f.id === fieldId)
    if (!exists) throw new Error("Field not found.")

    await db
      .update(Production)
      .set({
        feedbackFormFields: production.feedbackFormFields.filter(
          (f) => f.id !== fieldId,
        ),
      })
      .where(eq(Production.id, productionId))

    revalidatePath("/", "layout")
    return { success: true }
  })
