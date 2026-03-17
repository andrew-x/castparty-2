"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"

export const updateRoleRejectReasons = secureActionClient
  .metadata({ action: "update-role-reject-reasons" })
  .inputSchema(
    z.object({
      roleId: z.string().min(1),
      rejectReasons: z.array(z.string().trim().min(1).max(200)).max(50),
    }),
  )
  .action(async ({ parsedInput: { roleId, rejectReasons }, ctx: { user } }) => {
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

    await db.update(Role).set({ rejectReasons }).where(eq(Role.id, roleId))

    revalidatePath("/", "layout")
    return { success: true }
  })
