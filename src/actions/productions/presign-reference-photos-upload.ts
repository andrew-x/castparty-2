"use server"

import { eq } from "drizzle-orm"
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
const MAX_FILES = 3

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase()
}

const presignSchema = z.object({
  roleId: z.string().min(1),
  files: z
    .array(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().refine((v) => ALLOWED_MIME_TYPES.includes(v), {
          message: "Use JPEG, PNG, WebP, or HEIC.",
        }),
        size: z
          .number()
          .int()
          .positive()
          .max(MAX_FILE_SIZE, "Each file must be under 10MB."),
      }),
    )
    .min(1)
    .max(MAX_FILES, `You can upload up to ${MAX_FILES} reference photos.`),
})

export const presignReferencePhotosUpload = secureActionClient
  .metadata({ action: "presign-reference-photos-upload" })
  .inputSchema(presignSchema)
  .action(async ({ parsedInput: { roleId, files }, ctx: { user } }) => {
    if (!user.activeOrganizationId) {
      throw new Error("No active organization.")
    }

    const role = await db.query.Role.findFirst({
      where: (r) => eq(r.id, roleId),
      with: {
        production: {
          columns: { organizationId: true },
        },
      },
      columns: { id: true },
    })

    if (!role || role.production.organizationId !== user.activeOrganizationId) {
      throw new Error("Role not found.")
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const ext = getExtension(file.filename)
        const key = `${r2Root}/temp/role-reference-photos/${generateId("file")}${ext ? `.${ext}` : ""}`
        const presignedUrl = await createPresignedUploadUrl(
          key,
          file.contentType,
        )
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`
        return { key, presignedUrl, publicUrl }
      }),
    )

    return { files: results }
  })
