"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"

export async function getRoles(productionId: string) {
  await checkAuth()

  return db.select().from(Role).where(eq(Role.productionId, productionId))
}
