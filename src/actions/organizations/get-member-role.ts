"use server"

import { and, eq } from "drizzle-orm"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"

export async function getMemberRole(organizationId: string, userId: string) {
  const result = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, userId),
    ),
    columns: { role: true },
  })

  return result?.role ?? null
}
