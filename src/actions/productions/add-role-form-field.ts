"use server"

import { eq } from "drizzle-orm"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { addRoleFormFieldSchema } from "@/lib/schemas/form-fields"
import type { CustomForm } from "@/lib/types"
import { generateId } from "@/lib/util"

export const addRoleFormField = secureActionClient
  .metadata({ action: "add-role-form-field" })
  .inputSchema(addRoleFormFieldSchema)
  .action(async ({ parsedInput: { roleId, type, label }, ctx: { user } }) => {
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

    const newField: CustomForm = {
      id: generateId("ff"),
      type,
      label,
      description: "",
      required: false,
      options: type === "SELECT" || type === "MULTISELECT" ? ["Option 1"] : [],
    }

    await db
      .update(Role)
      .set({ formFields: [...role.formFields, newField] })
      .where(eq(Role.id, roleId))

    return { id: newField.id }
  })
