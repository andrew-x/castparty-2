"use server"

import { eq } from "drizzle-orm"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { removeRoleFormFieldSchema } from "@/lib/schemas/form-fields"

export const removeRoleFormField = secureActionClient
  .metadata({ action: "remove-role-form-field" })
  .inputSchema(removeRoleFormFieldSchema)
  .action(async ({ parsedInput: { roleId, fieldId }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    const role = await db.query.Role.findFirst({
      where: (r) => eq(r.id, roleId),
      columns: { id: true, formFields: true },
      with: {
        production: { columns: { organizationId: true } },
      },
    })
    if (!role || role.production.organizationId !== orgId) {
      throw new Error("Role not found.")
    }

    const exists = role.formFields.some((f) => f.id === fieldId)
    if (!exists) throw new Error("Field not found.")

    await db
      .update(Role)
      .set({ formFields: role.formFields.filter((f) => f.id !== fieldId) })
      .where(eq(Role.id, roleId))

    return { success: true }
  })
