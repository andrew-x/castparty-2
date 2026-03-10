"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { removeRoleFeedbackFormFieldSchema } from "@/lib/schemas/form-fields"

export const removeRoleFeedbackFormField = secureActionClient
  .metadata({ action: "remove-role-feedback-form-field" })
  .inputSchema(removeRoleFeedbackFormFieldSchema)
  .action(async ({ parsedInput: { roleId, fieldId }, ctx: { user } }) => {
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

    const exists = role.feedbackFormFields.some((f) => f.id === fieldId)
    if (!exists) throw new Error("Field not found.")

    await db
      .update(Role)
      .set({
        feedbackFormFields: role.feedbackFormFields.filter(
          (f) => f.id !== fieldId,
        ),
      })
      .where(eq(Role.id, roleId))

    revalidatePath("/", "layout")
    return { success: true }
  })
