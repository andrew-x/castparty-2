"use server"

import { headers } from "next/headers"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"
import db from "@/lib/db/db"
import { OrganizationProfile } from "@/lib/db/schema"
import { nameToSlug, RESERVED_SLUGS } from "@/lib/slug"

export const createOrganization = secureActionClient
  .metadata({ action: "create-organization" })
  .inputSchema(
    z.object({
      name: z.string().trim().min(1, "Organization name is required.").max(100),
      slug: z
        .string()
        .trim()
        .min(3, "URL ID must be at least 3 characters.")
        .max(60, "URL ID must be at most 60 characters.")
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Lowercase letters, numbers, and hyphens only.",
        )
        .refine((s) => !/^\d+$/.test(s), "URL ID cannot be purely numeric.")
        .refine((s) => !RESERVED_SLUGS.has(s), "This URL ID is reserved.")
        .optional(),
    }),
  )
  .action(async ({ parsedInput: { name, slug }, ctx: { user } }) => {
    const finalSlug = slug || nameToSlug(name)

    const org = await auth.api.createOrganization({
      body: {
        name,
        slug: finalSlug,
        userId: user.id,
      },
    })

    if (!org) {
      throw new Error("Failed to create organization.")
    }

    await db
      .insert(OrganizationProfile)
      .values({ id: org.id, isOrganizationProfileOpen: true })
      .onConflictDoNothing()

    await auth.api.setActiveOrganization({
      body: { organizationId: org.id },
      headers: await headers(),
    })

    return { organizationId: org.id }
  })
