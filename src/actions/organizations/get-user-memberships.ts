"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export async function hasAnyOrganization() {
  const user = await checkAuth()

  const result = await db.query.member.findFirst({
    where: eq(member.userId, user.id),
    columns: { organizationId: true },
  })

  return !!result
}
