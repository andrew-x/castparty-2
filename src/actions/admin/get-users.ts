"use server"

import { desc } from "drizzle-orm"
import db from "@/lib/db/db"
import { user } from "@/lib/db/schema"
import { IS_DEV } from "@/lib/util"

export async function getUsers() {
  if (!IS_DEV) throw new Error("Not available in production")
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
}
