"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export const transferOwnership = secureActionClient
  .metadata({ action: "transfer-ownership" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
      memberId: z.string().min(1),
    }),
  )
  .action(
    async ({ parsedInput: { organizationId, memberId }, ctx: { user } }) => {
      // Check caller is owner
      const callerMembership = await db
        .select({ id: member.id, role: member.role })
        .from(member)
        .where(
          and(
            eq(member.organizationId, organizationId),
            eq(member.userId, user.id),
          ),
        )
        .limit(1)

      if (!callerMembership[0] || callerMembership[0].role !== "owner") {
        throw new Error("Only the owner can transfer ownership.")
      }

      // Get the target member
      const [targetMember] = await db
        .select({ id: member.id, role: member.role, userId: member.userId })
        .from(member)
        .where(
          and(
            eq(member.id, memberId),
            eq(member.organizationId, organizationId),
          ),
        )
        .limit(1)

      if (!targetMember) {
        throw new Error("Member not found.")
      }

      if (targetMember.userId === user.id) {
        throw new Error("You already own this organization.")
      }

      // Transfer: new owner gets "owner", old owner becomes "admin"
      await db
        .update(member)
        .set({ role: "owner" })
        .where(eq(member.id, targetMember.id))

      await db
        .update(member)
        .set({ role: "admin" })
        .where(eq(member.id, callerMembership[0].id))

      return { success: true }
    },
  )
