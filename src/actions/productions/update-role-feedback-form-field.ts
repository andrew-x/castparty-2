"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { updateRoleFeedbackFormFieldSchema } from "@/lib/schemas/form-fields"

export const updateRoleFeedbackFormField = secureActionClient
  .metadata({ action: "update-role-feedback-form-field" })
  .inputSchema(updateRoleFeedbackFormFieldSchema)
  .action(
    async ({ parsedInput: { roleId, fieldId, ...updates }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const role = await db.query.Role.findFirst({
        where: (r) => eq(r.id, roleId),
        columns: { id: true, feedbackFormFields: true },
        with: {
          production: { columns: { organizationId: true } },
        },
      })
      if (!role || role.production.organizationId !== orgId) {
        throw new Error("Role not found.")
      }

      const fieldIndex = role.feedbackFormFields.findIndex(
        (f) => f.id === fieldId,
      )
      if (fieldIndex === -1) throw new Error("Field not found.")

      const field = role.feedbackFormFields[fieldIndex]

      if (
        updates.options !== undefined &&
        (field.type === "SELECT" || field.type === "CHECKBOX_GROUP") &&
        updates.options.length === 0
      ) {
        throw new Error("Select fields must have at least one option.")
      }

      const updated = [...role.feedbackFormFields]
      updated[fieldIndex] = { ...field, ...updates }

      await db
        .update(Role)
        .set({ feedbackFormFields: updated })
        .where(eq(Role.id, roleId))

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
