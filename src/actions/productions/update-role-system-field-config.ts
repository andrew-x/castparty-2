"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { updateRoleSystemFieldConfigSchema } from "@/lib/schemas/form-fields"

export const updateRoleSystemFieldConfig = secureActionClient
  .metadata({ action: "update-role-system-field-config" })
  .inputSchema(updateRoleSystemFieldConfigSchema)
  .action(
    async ({ parsedInput: { roleId, systemFieldConfig }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const role = await db.query.Role.findFirst({
        where: (r) => eq(r.id, roleId),
        with: {
          production: { columns: { organizationId: true } },
        },
        columns: { id: true },
      })
      if (!role || role.production.organizationId !== orgId) {
        throw new Error("Role not found.")
      }

      await db
        .update(Role)
        .set({ systemFieldConfig })
        .where(eq(Role.id, roleId))

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
