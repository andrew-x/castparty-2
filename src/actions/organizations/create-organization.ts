"use server"

import { headers } from "next/headers"
import { secureActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"
import db from "@/lib/db/db"
import { OrganizationProfile } from "@/lib/db/schema"
import { createOrgActionSchema } from "@/lib/schemas/organization"
import { nameToSlug } from "@/lib/slug"

export const createOrganization = secureActionClient
  .metadata({ action: "create-organization" })
  .inputSchema(createOrgActionSchema)
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
