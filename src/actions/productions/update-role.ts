"use server"

import { and, eq, not } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { updateRoleActionSchema } from "@/lib/schemas/role"

export const updateRole = secureActionClient
  .metadata({ action: "update-role" })
  .inputSchema(updateRoleActionSchema)
  .action(async ({ parsedInput: { roleId, ...fields }, ctx: { user } }) => {
    if (!user.activeOrganizationId) {
      throw new Error("No active organization.")
    }

    const role = await db.query.Role.findFirst({
      where: (r) => eq(r.id, roleId),
      with: {
        production: {
          columns: { id: true, organizationId: true },
        },
      },
      columns: { id: true, productionId: true },
    })

    if (!role || role.production.organizationId !== user.activeOrganizationId) {
      throw new Error("Role not found.")
    }

    if (fields.slug !== undefined) {
      const newSlug = fields.slug
      const conflict = await db.query.Role.findFirst({
        where: (r) =>
          and(
            eq(r.productionId, role.productionId),
            eq(r.slug, newSlug),
            not(eq(r.id, roleId)),
          ),
        columns: { id: true },
      })

      if (conflict) {
        throw new Error("This URL ID is already taken in this production.")
      }
    }

    const updates: Partial<typeof Role.$inferInsert> = {}
    if (fields.name !== undefined) updates.name = fields.name
    if (fields.description !== undefined)
      updates.description = fields.description
    if (fields.slug !== undefined) updates.slug = fields.slug
    if (fields.status !== undefined) updates.status = fields.status

    if (Object.keys(updates).length > 0) {
      await db.update(Role).set(updates).where(eq(Role.id, roleId))
    }

    revalidatePath("/", "layout")
    return { success: true }
  })
