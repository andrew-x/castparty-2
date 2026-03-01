"use server"

import { eq } from "drizzle-orm"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export async function hasAnyOrganization(userId: string) {
  const result = await db.query.member.findFirst({
    where: eq(member.userId, userId),
    columns: { organizationId: true },
  })

  return !!result
}
