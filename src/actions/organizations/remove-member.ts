"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export const removeMember = secureActionClient
  .metadata({ action: "remove-member" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
      memberId: z.string().min(1),
    }),
  )
  .action(
    async ({ parsedInput: { organizationId, memberId }, ctx: { user } }) => {
      // Check caller is owner or admin
      const callerMembership = await db
        .select({ role: member.role })
        .from(member)
        .where(
          and(
            eq(member.organizationId, organizationId),
            eq(member.userId, user.id),
          ),
        )
        .limit(1)

      if (
        !callerMembership[0] ||
        !["owner", "admin"].includes(callerMembership[0].role)
      ) {
        throw new Error("You don't have permission to remove members.")
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

      // Cannot remove the owner
      if (targetMember.role === "owner") {
        throw new Error("Cannot remove the owner. Transfer ownership first.")
      }

      // Admins cannot remove other admins
      if (
        callerMembership[0].role === "admin" &&
        targetMember.role === "admin"
      ) {
        throw new Error("Only the owner can remove an admin.")
      }

      // Cannot remove yourself
      if (targetMember.userId === user.id) {
        throw new Error("You cannot remove yourself from the organization.")
      }

      await db.delete(member).where(eq(member.id, memberId))

      return { success: true }
    },
  )
