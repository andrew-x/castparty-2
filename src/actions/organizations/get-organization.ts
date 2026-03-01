"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export async function getOrganization(orgId: string) {
  const currentUser = await checkAuth()

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, orgId),
      eq(member.userId, currentUser.id),
    ),
    columns: { role: true },
  })

  if (!membership) {
    throw new Error("You don't have access to this organization.")
  }

  const org = await db.query.organization.findFirst({
    where: (o) => eq(o.id, orgId),
    with: {
      members: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  })

  if (!org) {
    throw new Error("Organization not found.")
  }

  const members = org.members.map((m) => ({
    id: m.id,
    role: m.role,
    createdAt: m.createdAt,
    userId: m.user.id,
    userName: m.user.name,
    userEmail: m.user.email,
    userImage: m.user.image,
  }))

  return {
    organization: org,
    members,
    currentUserRole: membership.role,
  }
}
