"use server"

import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { publicActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { user } from "@/lib/db/schema"
import { IS_DEV } from "@/lib/util"

export const deleteUserAction = publicActionClient
  .metadata({ action: "delete-user" })
  .inputSchema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput: { userId } }) => {
    if (!IS_DEV) throw new Error("Not available in production")
    await db.delete(user).where(eq(user.id, userId))
    return { success: true }
  })
