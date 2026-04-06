"use server"

import { revalidatePath } from "next/cache"
import { adminActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"
import { createUserActionSchema } from "@/lib/schemas/admin"

export const createUserAction = adminActionClient
  .metadata({ action: "create-user" })
  .inputSchema(createUserActionSchema)
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
