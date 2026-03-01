"use server"

import { createId } from "@paralleldrive/cuid2"
import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { invitation, member, user } from "@/lib/db/schema"

export const inviteMember = secureActionClient
  .metadata({ action: "invite-member" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
      email: z.string().trim().email("Enter a valid email."),
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

      // Check if user with this email exists
      const [invitedUser] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1)

      if (!invitedUser) {
        throw new Error(
          "No account found with that email. They need to sign up first.",
        )
      }

      // Check if already a member
      const existingMembership = await db
        .select({ id: member.id })
        .from(member)
        .where(
          and(
            eq(member.organizationId, organizationId),
            eq(member.userId, invitedUser.id),
          ),
        )
        .limit(1)

      if (existingMembership[0]) {
        throw new Error("This person is already a member of the organization.")
      }

      // Create the invitation record (stubbed — no email sent)
      const invitationId = createId()
      await db.insert(invitation).values({
        id: invitationId,
        organizationId,
        email,
        role,
        status: "accepted",
        expiresAt: day().add(48, "hours").toDate(),
        inviterId: currentUser.id,
      })

      // Auto-accept: create member directly
      await db.insert(member).values({
        id: createId(),
        organizationId,
        userId: invitedUser.id,
        role,
        createdAt: new Date(),
      })

      return { success: true }
    },
  )
