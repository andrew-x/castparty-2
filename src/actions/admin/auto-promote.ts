"use server"

import { eq } from "drizzle-orm"
import db from "@/lib/db/db"
import { user } from "@/lib/db/schema"
import { IS_DEV } from "@/lib/util"

/**
 * Auto-promotes a user to admin so better-auth impersonation works.
 * Only available in dev — the admin layout already gates rendering with IS_DEV.
 */
export async function autoPromoteToAdmin(userId: string) {
  if (!IS_DEV) throw new Error("Not available in production")

  await db.update(user).set({ role: "admin" }).where(eq(user.id, userId))
}
