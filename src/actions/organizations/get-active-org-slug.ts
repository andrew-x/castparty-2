"use server"

import { eq } from "drizzle-orm"
import { checkAuth } from "@/lib/auth/auth-util"
import db from "@/lib/db/db"
import { organization } from "@/lib/db/schema"

export async function getActiveOrgSlug(): Promise<string> {
  const user = await checkAuth()
  if (!user.activeOrganizationId) {
    throw new Error("No active organization.")
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, user.activeOrganizationId),
    columns: { slug: true },
  })

  if (!org) {
    throw new Error("Organization not found.")
  }

  return org.slug
}
