"use server"

import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export interface OrgInvitation {
  id: string
  email: string
  role: string
  expiresAt: Date
}

export async function getOrgInvitations(
  organizationId: string,
): Promise<OrgInvitation[]> {
  const currentUser = await checkAuth()

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
    return []
  }

  const invitations = await auth.api.listInvitations({
    query: { organizationId },
    headers: await headers(),
  })

  return invitations
    .filter((inv) => inv.status === "pending")
    .map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
    }))
}
