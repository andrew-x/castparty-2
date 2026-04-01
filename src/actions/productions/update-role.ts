"use server"

import { and, eq, not } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import {
  copyFileByKey,
  deleteFile,
  deleteFileByKey,
  getKeyFromUrl,
  isR2Url,
  isTempKey,
} from "@/lib/r2"
import { updateRoleActionSchema } from "@/lib/schemas/role"

export const updateRole = secureActionClient
  .metadata({ action: "update-role" })
  .inputSchema(updateRoleActionSchema)
  .action(async ({ parsedInput: { roleId, ...fields }, ctx: { user } }) => {
    if (!user.activeOrganizationId) {
      throw new Error("No active organization.")
    }

    const role = await db.query.Role.findFirst({
      where: (r) => eq(r.id, roleId),
      with: {
        production: {
          columns: { id: true, organizationId: true },
        },
      },
      columns: { id: true, productionId: true, referencePhotos: true },
    })

    if (!role || role.production.organizationId !== user.activeOrganizationId) {
      throw new Error("Role not found.")
    }

    if (fields.slug !== undefined) {
      const newSlug = fields.slug
      const conflict = await db.query.Role.findFirst({
        where: (r) =>
          and(
            eq(r.productionId, role.productionId),
            eq(r.slug, newSlug),
            not(eq(r.id, roleId)),
          ),
        columns: { id: true },
      })

      if (conflict) {
        throw new Error("This URL ID is already taken in this production.")
      }
    }

    // Validate all reference photo URLs are R2 URLs
    if (fields.referencePhotos) {
      for (const url of fields.referencePhotos) {
        if (!isR2Url(url)) {
          throw new Error("Invalid reference photo URL.")
        }
      }
    }

    // Copy (not move) temp reference photos to permanent before DB write
    let finalPhotos: string[] | undefined
    const tempPhotoKeys: string[] = []
    const copiedPermanentUrls: string[] = []
    if (fields.referencePhotos !== undefined) {
      finalPhotos = await Promise.all(
        fields.referencePhotos.map(async (url) => {
          const key = getKeyFromUrl(url)
          if (isTempKey(key)) {
            tempPhotoKeys.push(key)
            const copied = await copyFileByKey(key, "role-reference-photos")
            copiedPermanentUrls.push(copied.url)
            return copied.url
          }
          return url
        }),
      )
    }

    const updates: Partial<typeof Role.$inferInsert> = {}
    if (fields.name !== undefined) updates.name = fields.name
    if (fields.description !== undefined)
      updates.description = fields.description
    if (fields.slug !== undefined) updates.slug = fields.slug
    if (fields.status !== undefined) updates.status = fields.status
    if (finalPhotos !== undefined) updates.referencePhotos = finalPhotos

    try {
      if (Object.keys(updates).length > 0) {
        await db.update(Role).set(updates).where(eq(Role.id, roleId))
      }
    } catch (err) {
      // DB failed — clean up permanent copies we just made
      await Promise.all(
        copiedPermanentUrls.map((url) => deleteFile(url).catch(() => {})),
      )
      throw err
    }

    // DB succeeded — delete temp files and removed old photos
    await Promise.all(
      tempPhotoKeys.map((key) => deleteFileByKey(key).catch(() => {})),
    )
    if (finalPhotos !== undefined) {
      const oldPhotos = (role.referencePhotos as string[]) ?? []
      const currentPhotos = finalPhotos
      const removed = oldPhotos.filter((url) => !currentPhotos.includes(url))
      await Promise.all(
        removed
          .filter((url) => isR2Url(url))
          .map((url) => deleteFile(url).catch(() => {})),
      )
    }

    revalidatePath("/", "layout")
    return { success: true }
  })
