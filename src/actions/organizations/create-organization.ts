"use server"

import { createId } from "@paralleldrive/cuid2"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)

  const suffix = createId().slice(0, 8)
  return `${base}-${suffix}`
}

export const createOrganization = secureActionClient
  .metadata({ action: "create-organization" })
  .inputSchema(
    z.object({
      name: z.string().min(1, "Organization name is required.").max(100),
    }),
  )
  .action(async ({ parsedInput: { name }, ctx: { user } }) => {
    const slug = generateSlug(name)

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
