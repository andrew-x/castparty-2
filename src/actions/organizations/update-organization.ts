"use server"

import { and, eq, not } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { member, OrganizationProfile, organization } from "@/lib/db/schema"
import {
  copyFileByKey,
  deleteFile,
  deleteFileByKey,
  getKeyFromUrl,
  isR2Url,
  isTempKey,
} from "@/lib/r2"
import { updateOrgActionSchema } from "@/lib/schemas/organization"

export const updateOrganization = secureActionClient
  .metadata({ action: "update-organization" })
  .inputSchema(updateOrgActionSchema)
  .action(
    async ({
      parsedInput: {
        organizationId,
        name,
        slug,
        description,
        websiteUrl,
        isOrganizationProfileOpen,
        logo,
      },
      ctx: { user },
    }) => {
      const membership = await db
        .select({ role: member.role })
        .from(member)
        .where(
          and(
            eq(member.organizationId, organizationId),
            eq(member.userId, user.id),
          ),
        )
        .limit(1)

      if (!membership[0] || !["owner", "admin"].includes(membership[0].role)) {
        throw new Error(
          "You don't have permission to update this organization.",
        )
      }

      if (slug) {
        const conflict = await db.query.organization.findFirst({
          where: (o) => and(eq(o.slug, slug), not(eq(o.id, organizationId))),
          columns: { id: true },
        })
        if (conflict) {
          throw new Error("This URL ID is already taken.")
        }
      }

      // Validate logo URL is an R2 URL if provided
      if (logo && !isR2Url(logo)) {
        throw new Error("Invalid logo URL.")
      }

      // Fetch current org to detect logo changes
      const currentOrg = await db.query.organization.findFirst({
        where: (o) => eq(o.id, organizationId),
        columns: { logo: true },
      })
      const oldLogo = currentOrg?.logo ?? null

      // Copy (not move) logo from temp to permanent before DB write
      let finalLogoUrl = logo ?? null
      let tempLogoKey: string | null = null
      if (finalLogoUrl && isTempKey(getKeyFromUrl(finalLogoUrl))) {
        tempLogoKey = getKeyFromUrl(finalLogoUrl)
        const copied = await copyFileByKey(tempLogoKey, "org-logos")
        finalLogoUrl = copied.url
      }

      try {
        await db.transaction(async (tx) => {
          await tx
            .update(organization)
            .set({
              name,
              ...(slug ? { slug } : {}),
              logo: finalLogoUrl,
            })
            .where(eq(organization.id, organizationId))

          await tx
            .insert(OrganizationProfile)
            .values({
              id: organizationId,
              description,
              websiteUrl,
              isOrganizationProfileOpen,
            })
            .onConflictDoUpdate({
              target: OrganizationProfile.id,
              set: {
                description,
                websiteUrl,
                isOrganizationProfileOpen,
                updatedAt: day().toDate(),
              },
            })
        })
      } catch (err) {
        // DB failed — clean up the permanent copy we just made
        if (finalLogoUrl && tempLogoKey) {
          await deleteFile(finalLogoUrl).catch(() => {})
        }
        throw err
      }

      // DB succeeded — delete temp file and old logo
      if (tempLogoKey) {
        await deleteFileByKey(tempLogoKey).catch(() => {})
      }
      if (oldLogo && oldLogo !== finalLogoUrl && isR2Url(oldLogo)) {
        await deleteFile(oldLogo).catch(() => {})
      }

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
