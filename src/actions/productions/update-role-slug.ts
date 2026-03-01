"use server"

import { and, eq, not } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { RESERVED_SLUGS } from "@/lib/slug"

export const updateRoleSlug = secureActionClient
  .metadata({ action: "update-role-slug" })
  .inputSchema(
    z.object({
      roleId: z.string().min(1),
      slug: z
        .string()
        .trim()
        .min(3, "URL ID must be at least 3 characters.")
        .max(60, "URL ID must be at most 60 characters.")
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Lowercase letters, numbers, and hyphens only.",
        )
        .refine((s) => !/^\d+$/.test(s), "URL ID cannot be purely numeric.")
        .refine((s) => !RESERVED_SLUGS.has(s), "This URL ID is reserved."),
    }),
  )
  .action(async ({ parsedInput: { roleId, slug }, ctx: { user } }) => {
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

    const conflict = await db.query.Role.findFirst({
      where: (r) =>
        and(
          eq(r.productionId, role.productionId),
          eq(r.slug, slug),
          not(eq(r.id, roleId)),
        ),
      columns: { id: true },
    })

    if (conflict) {
      throw new Error("This URL ID is already taken in this production.")
    }

    await db.update(Role).set({ slug }).where(eq(Role.id, roleId))

    return { success: true }
  })
