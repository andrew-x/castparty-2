"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { OrganizationProfile } from "@/lib/db/schema"

export async function getOrganizationProfile(organizationId: string) {
  await checkAuth()

  let profile = await db.query.OrganizationProfile.findFirst({
    where: (p) => eq(p.id, organizationId),
  })

  if (!profile) {
    await db
      .insert(OrganizationProfile)
      .values({ id: organizationId, isOrganizationProfileOpen: true })
      .onConflictDoNothing()

    profile = await db.query.OrganizationProfile.findFirst({
      where: (p) => eq(p.id, organizationId),
    })
  }

  // Profile is guaranteed after insert+re-fetch; fallback for safety
  return (
    profile ?? {
      id: organizationId,
      websiteUrl: "",
      description: "",
      isOrganizationProfileOpen: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  )
}
