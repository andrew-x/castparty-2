"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { reorderRoleFormFieldsSchema } from "@/lib/schemas/form-fields"

export const reorderRoleFormFields = secureActionClient
  .metadata({ action: "reorder-role-form-fields" })
  .inputSchema(reorderRoleFormFieldsSchema)
  .action(async ({ parsedInput: { roleId, fieldIds }, ctx: { user } }) => {
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

    const uniqueIds = new Set(fieldIds)
    if (
      uniqueIds.size !== fieldIds.length ||
      uniqueIds.size !== role.formFields.length
    ) {
      throw new Error("Field IDs must match existing fields exactly.")
    }

    const fieldMap = new Map(role.formFields.map((f) => [f.id, f]))
    const reordered = fieldIds.map((id) => {
      const field = fieldMap.get(id)
      if (!field) throw new Error("Field not found.")
      return field
    })

    await db
      .update(Role)
      .set({ formFields: reordered })
      .where(eq(Role.id, roleId))

    revalidatePath("/", "layout")
    return { success: true }
  })
