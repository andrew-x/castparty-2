"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export const updateMemberRole = secureActionClient
  .metadata({ action: "update-member-role" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
      memberId: z.string().min(1),
      role: z.enum(["admin", "member"]),
    }),
  )
  .action(
    async ({
      parsedInput: { organizationId, memberId, role },
      ctx: { user },
    }) => {
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
        throw new Error("You don't have permission to change member roles.")
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

      // Cannot change role of the owner
      if (targetMember.role === "owner") {
        throw new Error(
          "Cannot change the owner's role. Transfer ownership instead.",
        )
      }

      // Admins cannot promote/demote other admins — only owner can
      if (
        callerMembership[0].role === "admin" &&
        targetMember.role === "admin"
      ) {
        throw new Error("Only the owner can change an admin's role.")
      }

      await db.update(member).set({ role }).where(eq(member.id, memberId))

      return { success: true }
    },
  )
