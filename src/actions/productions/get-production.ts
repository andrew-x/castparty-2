"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"

export async function getProduction(id: string) {
  await checkAuth()

  return (
    (await db.query.Production.findFirst({
      where: (p) => eq(p.id, id),
    })) ?? null
  )
}
