"use server"

import { eq } from "drizzle-orm"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export async function hasAnyOrganization(userId: string) {
  const result = await db
    .select({ orgId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1)

  return result.length > 0
}
