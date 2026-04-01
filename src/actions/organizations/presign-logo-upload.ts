"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { member } from "@/lib/db/schema"
import { createPresignedUploadUrl, r2Root } from "@/lib/r2"
import { generateId } from "@/lib/util"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]
const MAX_FILE_SIZE = 5 * 1024 * 1024

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase()
}

const presignSchema = z.object({
  organizationId: z.string().min(1),
  file: z.object({
    filename: z.string().min(1),
    contentType: z.string().refine((v) => ALLOWED_MIME_TYPES.includes(v), {
      message: "Use JPEG, PNG, WebP, or HEIC.",
    }),
    size: z
      .number()
      .int()
      .positive()
      .max(MAX_FILE_SIZE, "File must be under 5MB."),
  }),
})

export const presignLogoUpload = secureActionClient
  .metadata({ action: "presign-logo-upload" })
  .inputSchema(presignSchema)
  .action(async ({ parsedInput: { organizationId, file }, ctx: { user } }) => {
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
        "You don't have permission to upload for this organization.",
      )
    }

    const ext = getExtension(file.filename)
    const key = `${r2Root}/temp/org-logos/${generateId("file")}${ext ? `.${ext}` : ""}`
    const presignedUrl = await createPresignedUploadUrl(key, file.contentType)
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return { key, presignedUrl, publicUrl }
  })
