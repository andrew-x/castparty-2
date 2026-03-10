"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { addRoleFeedbackFormFieldSchema } from "@/lib/schemas/form-fields"
import type { CustomForm } from "@/lib/types"
import { generateId } from "@/lib/util"

export const addRoleFeedbackFormField = secureActionClient
  .metadata({ action: "add-role-feedback-form-field" })
  .inputSchema(addRoleFeedbackFormFieldSchema)
  .action(async ({ parsedInput: { roleId, type, label }, ctx: { user } }) => {
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

    const newField: CustomForm = {
      id: generateId("fbf"),
      type,
      label,
      description: "",
      required: false,
      options: [],
    }

    await db
      .update(Role)
      .set({ feedbackFormFields: [...role.feedbackFormFields, newField] })
      .where(eq(Role.id, roleId))

    revalidatePath("/", "layout")
    return { id: newField.id }
  })
