"use server"

import { eq } from "drizzle-orm"
import db from "@/lib/db/db"
import { user } from "@/lib/db/schema"
import { IS_DEV } from "@/lib/util"

/**
 * Auto-promotes a user to admin so better-auth impersonation works.
 * Only available in dev — the admin layout already gates rendering with IS_DEV.
 *
 * This is a plain function (not an adminActionClient action) because it's
 * called programmatically from the admin UI, not as a form-submitted action.
 * The IS_DEV guard is sufficient since the entire admin section is gated by
 * the same check at the layout level.
 */
export async function autoPromoteToAdmin(userId: string) {
  if (!IS_DEV) throw new Error("Not available in production")

  await db.update(user).set({ role: "admin" }).where(eq(user.id, userId))
}
