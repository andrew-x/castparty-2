"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"

export const setActiveOrganization = secureActionClient
  .metadata({ action: "set-active-organization" })
  .inputSchema(
    z.object({
      organizationId: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput: { organizationId } }) => {
    await auth.api.setActiveOrganization({
      body: { organizationId },
      headers: await headers(),
    })

    revalidatePath("/", "layout")

    return { success: true }
  })
