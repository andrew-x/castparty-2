"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"

export async function getProduction(id: string) {
  await checkAuth()

  const rows = await db
    .select()
    .from(Production)
    .where(eq(Production.id, id))
    .limit(1)

  return rows[0] ?? null
}
