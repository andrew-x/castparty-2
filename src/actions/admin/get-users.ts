"use server"

import { desc } from "drizzle-orm"
import db from "@/lib/db/db"
import { IS_DEV } from "@/lib/util"

export async function getUsers() {
  if (!IS_DEV) throw new Error("Not available in production")

  return db.query.user.findMany({
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: (u) => desc(u.createdAt),
  })
}
