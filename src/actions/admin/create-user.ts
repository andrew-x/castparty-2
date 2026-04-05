"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { adminActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"

export const createUserAction = adminActionClient
  .metadata({ action: "create-user" })
  .inputSchema(
    z.object({
      firstName: z.string().trim().min(1),
      lastName: z.string().trim().min(1),
      email: z.string().trim().pipe(z.email()),
      password: z.string().min(8),
    }),
  )
  .action(async ({ parsedInput: { firstName, lastName, email, password } }) => {
    await auth.api.signUpEmail({
      body: {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        password,
      },
    })
    revalidatePath("/", "layout")
    return { success: true }
  })
