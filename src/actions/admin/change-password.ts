"use server"

import { hashPassword } from "better-auth/crypto"
import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { adminActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { account } from "@/lib/db/schema"

export const changePasswordAction = adminActionClient
  .metadata({ action: "change-password" })
  .inputSchema(
    z.object({
      userId: z.string(),
      password: z.string().min(8),
    }),
  )
  .action(async ({ parsedInput: { userId, password } }) => {
    const hashed = await hashPassword(password)
    await db
      .update(account)
      .set({ password: hashed })
      .where(
        and(eq(account.userId, userId), eq(account.providerId, "credential")),
      )
    return { success: true }
  })
