"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { member, organization, user } from "@/lib/db/schema"

export async function getOrganization(orgId: string) {
  const currentUser = await checkAuth()

  const membership = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(eq(member.organizationId, orgId), eq(member.userId, currentUser.id)),
    )
    .limit(1)

  if (!membership[0]) {
    throw new Error("You don't have access to this organization.")
  }

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)

  if (!org) {
    throw new Error("Organization not found.")
  }

  const members = await db
    .select({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      userId: member.userId,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId))

  return {
    organization: org,
    members,
    currentUserRole: membership[0].role,
  }
}
