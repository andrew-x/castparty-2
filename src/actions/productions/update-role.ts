"use server"

import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"

export const updateRole = secureActionClient
  .metadata({ action: "update-role" })
  .inputSchema(
    z.object({
      roleId: z.string().min(1),
      name: z
        .string()
        .trim()
        .min(1, "Role name is required.")
        .max(100)
        .optional(),
      description: z.string().trim().optional(),
      isOpen: z.boolean().optional(),
    }),
  )
  .action(async ({ parsedInput: { roleId, ...fields }, ctx: { user } }) => {
    if (!user.activeOrganizationId) {
      throw new Error("No active organization.")
    }

    const role = await db.query.Role.findFirst({
      where: (r) => eq(r.id, roleId),
      with: {
        production: {
          columns: { organizationId: true },
        },
      },
      columns: { id: true },
    })

    if (!role || role.production.organizationId !== user.activeOrganizationId) {
      throw new Error("Role not found.")
    }

    const updates: Partial<typeof Role.$inferInsert> = {}
    if (fields.name !== undefined) updates.name = fields.name
    if (fields.description !== undefined)
      updates.description = fields.description
    if (fields.isOpen !== undefined) updates.isOpen = fields.isOpen

    if (Object.keys(updates).length > 0) {
      await db.update(Role).set(updates).where(eq(Role.id, roleId))
    }

    return { success: true }
  })
