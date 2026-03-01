"use server"

import { desc, eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"

export async function getProductions() {
  const user = await checkAuth()

  if (!user.activeOrganizationId) {
    return []
  }

  return db
    .select()
    .from(Production)
    .where(eq(Production.organizationId, user.activeOrganizationId))
    .orderBy(desc(Production.createdAt))
}
