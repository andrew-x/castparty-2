"use server"

import { and, desc, eq, gte } from "drizzle-orm"
import { headers } from "next/headers"
import { secureActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { invitation, member } from "@/lib/db/schema"
import { inviteActionSchema } from "@/lib/schemas/organization"

const MAX_REJECTED_INVITES = 3

export const inviteMember = secureActionClient
  .metadata({ action: "invite-member" })
  .inputSchema(inviteActionSchema)
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

      // Check for repeated rejections to prevent spam
      const thirtyDaysAgo = day().subtract(30, "day").toDate()

      const recentInvites = await db
        .select({ status: invitation.status })
        .from(invitation)
        .where(
          and(
            eq(invitation.organizationId, organizationId),
            eq(invitation.email, email),
            gte(invitation.createdAt, thirtyDaysAgo),
          ),
        )
        .orderBy(desc(invitation.createdAt))
        .limit(MAX_REJECTED_INVITES)

      const consecutiveRejections = recentInvites.every(
        (i) => i.status === "rejected",
      )

      if (
        recentInvites.length >= MAX_REJECTED_INVITES &&
        consecutiveRejections
      ) {
        throw new Error(
          "This person has declined multiple invitations from your organization. Contact support for help.",
        )
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
