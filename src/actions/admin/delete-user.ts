"use server"

import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { adminActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { user } from "@/lib/db/schema"

export const deleteUserAction = adminActionClient
  .metadata({ action: "delete-user" })
  .inputSchema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput: { userId } }) => {
    await db.delete(user).where(eq(user.id, userId))
    return { success: true }
  })
