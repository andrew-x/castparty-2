"use server"

import { hashPassword } from "better-auth/crypto"
import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { publicActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { account } from "@/lib/db/schema"
import { IS_DEV } from "@/lib/util"

export const changePasswordAction = publicActionClient
  .metadata({ action: "change-password" })
  .inputSchema(
    z.object({
      userId: z.string(),
      password: z.string().min(8),
    }),
  )
  .action(async ({ parsedInput: { userId, password } }) => {
    if (!IS_DEV) throw new Error("Not available in production")
    const hashed = await hashPassword(password)
    await db
      .update(account)
      .set({ password: hashed })
      .where(
        and(eq(account.userId, userId), eq(account.providerId, "credential")),
      )
    return { success: true }
  })
