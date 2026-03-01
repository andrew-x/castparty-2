"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { member, organization } from "@/lib/db/schema"

export const updateOrganization = secureActionClient
  .metadata({ action: "update-organization" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
      name: z.string().trim().min(1, "Organization name is required.").max(100),
    }),
  )
  .action(async ({ parsedInput: { organizationId, name }, ctx: { user } }) => {
    const membership = await db
      .select({ role: member.role })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, user.id),
        ),
      )
      .limit(1)

    if (!membership[0] || !["owner", "admin"].includes(membership[0].role)) {
      throw new Error("You don't have permission to update this organization.")
    }

    await db
      .update(organization)
      .set({ name })
      .where(eq(organization.id, organizationId))

    return { success: true }
  })
