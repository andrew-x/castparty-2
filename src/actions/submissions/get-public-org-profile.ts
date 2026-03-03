"use server"

import { eq } from "drizzle-orm"
import db from "@/lib/db/db"
import { OrganizationProfile } from "@/lib/db/schema"

export async function getPublicOrgProfile(organizationId: string) {
  let profile = await db.query.OrganizationProfile.findFirst({
    where: (p) => eq(p.id, organizationId),
    columns: {
      isOrganizationProfileOpen: true,
      description: true,
      websiteUrl: true,
    },
  })

  if (!profile) {
    await db
      .insert(OrganizationProfile)
      .values({ id: organizationId, isOrganizationProfileOpen: true })
      .onConflictDoNothing()

    profile = await db.query.OrganizationProfile.findFirst({
      where: (p) => eq(p.id, organizationId),
      columns: {
        isOrganizationProfileOpen: true,
        description: true,
        websiteUrl: true,
      },
    })
  }

  return {
    isOrganizationProfileOpen: profile?.isOrganizationProfileOpen ?? true,
    description: profile?.description ?? "",
    websiteUrl: profile?.websiteUrl ?? "",
  }
}
