"use server"

import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"
import { nameToSlug } from "@/lib/slug"

export const createOrganization = secureActionClient
  .metadata({ action: "create-organization" })
  .inputSchema(
    z.object({
      name: z.string().trim().min(1, "Organization name is required.").max(100),
    }),
  )
  .action(async ({ parsedInput: { name }, ctx: { user } }) => {
    const slug = nameToSlug(name)

    const org = await auth.api.createOrganization({
      body: {
        name,
        slug,
        userId: user.id,
      },
    })

    if (!org) {
      throw new Error("Failed to create organization.")
    }

    return { organizationId: org.id }
  })
