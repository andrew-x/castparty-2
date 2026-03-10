"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { addProductionFeedbackFormFieldSchema } from "@/lib/schemas/form-fields"
import type { CustomForm } from "@/lib/types"
import { generateId } from "@/lib/util"

export const addProductionFeedbackFormField = secureActionClient
  .metadata({ action: "add-production-feedback-form-field" })
  .inputSchema(addProductionFeedbackFormFieldSchema)
  .action(
    async ({ parsedInput: { productionId, type, label }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true, feedbackFormFields: true },
      })
      if (!production) throw new Error("Production not found.")

      const newField: CustomForm = {
        id: generateId("fbf"),
        type,
        label,
        description: "",
        required: false,
        options: [],
      }

      await db
        .update(Production)
        .set({
          feedbackFormFields: [...production.feedbackFormFields, newField],
        })
        .where(eq(Production.id, productionId))

      revalidatePath("/", "layout")
      return { id: newField.id }
    },
  )
