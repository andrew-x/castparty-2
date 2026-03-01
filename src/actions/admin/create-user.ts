"use server"

import { z } from "zod/v4"
import { publicActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"
import { IS_DEV } from "@/lib/util"

export const createUserAction = publicActionClient
  .metadata({ action: "create-user" })
  .inputSchema(
    z.object({
      name: z.string().trim().min(1),
      email: z.string().trim().email(),
      password: z.string().min(8),
    }),
  )
  .action(async ({ parsedInput: { name, email, password } }) => {
    if (!IS_DEV) throw new Error("Not available in production")
    await auth.api.signUpEmail({
      body: { name, email, password },
    })
    return { success: true }
  })
