"use server"

import { eq } from "drizzle-orm"
import db from "@/lib/db/db"

export async function getPublicRole(roleId: string) {
  return (
    (await db.query.Role.findFirst({
      where: (r) => eq(r.id, roleId),
      with: { production: true },
    })) ?? null
  )
}
