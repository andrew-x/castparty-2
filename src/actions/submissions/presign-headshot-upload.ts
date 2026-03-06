"use server"

import { z } from "zod/v4"
import { publicActionClient } from "@/lib/action"
import { createPresignedUploadUrl, r2Root } from "@/lib/r2"
import { generateId } from "@/lib/util"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]
const MAX_FILE_SIZE = 20 * 1024 * 1024
const MAX_FILES = 10

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase()
}

const presignSchema = z.object({
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
          .max(MAX_FILE_SIZE, "Each file must be under 20MB."),
      }),
    )
    .min(1)
    .max(MAX_FILES, `You can upload up to ${MAX_FILES} headshots.`),
})

export const presignHeadshotUpload = publicActionClient
  .metadata({ action: "presign-headshot-upload" })
  .inputSchema(presignSchema)
  .action(async ({ parsedInput: { files } }) => {
    const results = await Promise.all(
      files.map(async (file) => {
        const ext = getExtension(file.filename)
        const key = `${r2Root}/temp/headshots/${generateId("file")}${ext ? `.${ext}` : ""}`
        const presignedUrl = await createPresignedUploadUrl(
          key,
          file.contentType,
        )
        return { key, presignedUrl }
      }),
    )

    return { files: results }
  })
