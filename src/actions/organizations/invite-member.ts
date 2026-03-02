"use server"

import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export const inviteMember = secureActionClient
  .metadata({ action: "invite-member" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
      email: z
        .string()
        .trim()
        .pipe(z.email({ error: "Enter a valid email." })),
      role: z.enum(["admin", "member"]),
    }),
  )
  .action(
    async ({
      parsedInput: { organizationId, email, role },
      ctx: { user: currentUser },
    }) => {
      // Check caller is owner or admin
      const callerMembership = await db
        .select({ role: member.role })
        .from(member)
        .where(
          and(
            eq(member.organizationId, organizationId),
            eq(member.userId, currentUser.id),
          ),
        )
        .limit(1)

      if (
        !callerMembership[0] ||
        !["owner", "admin"].includes(callerMembership[0].role)
      ) {
        throw new Error("You don't have permission to invite members.")
      }

      await auth.api.createInvitation({
        body: {
          email,
          role,
          organizationId,
        },
        headers: await headers(),
      })

      return { success: true }
    },
  )
