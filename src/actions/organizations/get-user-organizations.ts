"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export async function getUserOrganizations() {
  const currentUser = await checkAuth()

  const memberships = await db.query.member.findMany({
    where: eq(member.userId, currentUser.id),
    with: {
      organization: {
        columns: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
    },
  })

  return memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    logo: m.organization.logo,
    role: m.role,
  }))
}
