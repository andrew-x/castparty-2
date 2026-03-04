"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { OrganizationProfile } from "@/lib/db/schema"

export async function getOrganizationProfile(organizationId: string) {
  await checkAuth()

  const profile = await db.query.OrganizationProfile.findFirst({
    where: (p) => eq(p.id, organizationId),
  })

  if (profile) return profile

  const [inserted] = await db
    .insert(OrganizationProfile)
    .values({ id: organizationId, isOrganizationProfileOpen: true })
    .onConflictDoNothing()
    .returning()

  return (
    inserted ?? {
      id: organizationId,
      websiteUrl: "",
      description: "",
      isOrganizationProfileOpen: true,
      createdAt: day().toDate(),
      updatedAt: day().toDate(),
    }
  )
}
