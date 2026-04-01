"use server"

import { and, eq, not } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import {
  copyFileByKey,
  deleteFile,
  deleteFileByKey,
  getKeyFromUrl,
  isR2Url,
  isTempKey,
} from "@/lib/r2"
import { updateProductionActionSchema } from "@/lib/schemas/production"

export const updateProduction = secureActionClient
  .metadata({ action: "update-production" })
  .inputSchema(updateProductionActionSchema)
  .action(
    async ({
      parsedInput: {
        productionId,
        name,
        description,
        slug,
        location,
        status,
        banner,
      },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true, organizationId: true, banner: true },
      })
      if (!production) throw new Error("Production not found.")

      const conflict = await db.query.Production.findFirst({
        where: (p) =>
          and(
            eq(p.organizationId, production.organizationId),
            eq(p.slug, slug),
            not(eq(p.id, productionId)),
          ),
        columns: { id: true },
      })
      if (conflict) throw new Error("This URL ID is already taken.")

      // Validate banner URL is an R2 URL if provided
      if (banner && !isR2Url(banner)) {
        throw new Error("Invalid banner URL.")
      }

      const oldBanner = production.banner ?? null

      // Copy (not move) banner from temp to permanent before DB write
      let finalBannerUrl = banner !== undefined ? (banner ?? null) : oldBanner
      let tempBannerKey: string | null = null
      if (finalBannerUrl && isTempKey(getKeyFromUrl(finalBannerUrl))) {
        tempBannerKey = getKeyFromUrl(finalBannerUrl)
        const copied = await copyFileByKey(tempBannerKey, "production-banners")
        finalBannerUrl = copied.url
      }

      try {
        await db
          .update(Production)
          .set({
            name,
            description,
            slug,
            location,
            ...(status !== undefined && { status }),
            ...(banner !== undefined && { banner: finalBannerUrl }),
          })
          .where(eq(Production.id, productionId))
      } catch (err) {
        // DB failed — clean up the permanent copy we just made
        if (finalBannerUrl && tempBannerKey) {
          await deleteFile(finalBannerUrl).catch(() => {})
        }
        throw err
      }

      // DB succeeded — delete temp file and old banner
      if (tempBannerKey) {
        await deleteFileByKey(tempBannerKey).catch(() => {})
      }
      if (oldBanner && oldBanner !== finalBannerUrl && isR2Url(oldBanner)) {
        await deleteFile(oldBanner).catch(() => {})
      }

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
