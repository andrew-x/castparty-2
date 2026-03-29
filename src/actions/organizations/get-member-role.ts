"use server"

import { and, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export async function getMemberRole(organizationId: string, userId: string) {
  const authedUser = await checkAuth()
  if (authedUser.id !== userId) {
    throw new Error("You can only query your own membership.")
  }
  const result = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, userId),
    ),
    columns: { role: true },
  })

  return result?.role ?? null
}
