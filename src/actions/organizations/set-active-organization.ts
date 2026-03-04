"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"
import db from "@/lib/db/db"

export const setActiveOrganization = secureActionClient
  .metadata({ action: "set-active-organization" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput: { organizationId }, ctx: { user } }) => {
    // Verify user is a member of this org
    const membership = await db.query.member.findFirst({
      where: (m) =>
        and(eq(m.organizationId, organizationId), eq(m.userId, user.id)),
      columns: { id: true },
    })
    if (!membership)
      throw new Error("You don't have access to this organization.")

    await auth.api.setActiveOrganization({
      body: { organizationId },
      headers: await headers(),
    })

    revalidatePath("/", "layout")

    return { success: true }
  })
