"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { createPresignedUploadUrl, r2Root } from "@/lib/r2"
import { generateId } from "@/lib/util"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]
const MAX_FILE_SIZE = 10 * 1024 * 1024

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase()
}

const presignSchema = z.object({
  productionId: z.string().min(1),
  file: z.object({
    filename: z.string().min(1),
    contentType: z.string().refine((v) => ALLOWED_MIME_TYPES.includes(v), {
      message: "Use JPEG, PNG, WebP, or HEIC.",
    }),
    size: z
      .number()
      .int()
      .positive()
      .max(MAX_FILE_SIZE, "File must be under 10MB."),
  }),
})

export const presignBannerUpload = secureActionClient
  .metadata({ action: "presign-banner-upload" })
  .inputSchema(presignSchema)
  .action(async ({ parsedInput: { productionId, file }, ctx: { user } }) => {
    const orgId = user.activeOrganizationId
    if (!orgId) throw new Error("No active organization.")

    const production = await db.query.Production.findFirst({
      where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
      columns: { id: true },
    })
    if (!production) throw new Error("Production not found.")

    const ext = getExtension(file.filename)
    const key = `${r2Root}/temp/production-banners/${generateId("file")}${ext ? `.${ext}` : ""}`
    const presignedUrl = await createPresignedUploadUrl(key, file.contentType)
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return { key, presignedUrl, publicUrl }
  })
