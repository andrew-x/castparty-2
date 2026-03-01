"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getRoles(productionId: string) {
  await checkAuth()

  return db.query.Role.findMany({
    where: (r) => eq(r.productionId, productionId),
  })
}
