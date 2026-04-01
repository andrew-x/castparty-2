"use server"

import { z } from "zod/v4"
import { publicActionClient } from "@/lib/action"
import { createPresignedUploadUrl, r2Root } from "@/lib/r2"
import { generateId } from "@/lib/util"

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]
const IMAGE_MAX_SIZE = 20 * 1024 * 1024
const DOCUMENT_MAX_SIZE = 10 * 1024 * 1024

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase()
}

const presignSchema = z.object({
  fieldType: z.enum(["IMAGE", "DOCUMENT"]),
  files: z
    .array(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().min(1),
        size: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(20),
})

export const presignCustomFieldUpload = publicActionClient
  .metadata({ action: "presign-custom-field-upload" })
  .inputSchema(presignSchema)
  .action(async ({ parsedInput: { fieldType, files } }) => {
    // Validate based on field type
    for (const file of files) {
      if (fieldType === "IMAGE") {
        if (!IMAGE_MIME_TYPES.includes(file.contentType)) {
          throw new Error("Use JPEG, PNG, WebP, or HEIC.")
        }
        if (file.size > IMAGE_MAX_SIZE) {
          throw new Error("Each image must be under 20MB.")
        }
      } else {
        if (file.contentType !== "application/pdf") {
          throw new Error("Only PDF files are accepted.")
        }
        if (file.size > DOCUMENT_MAX_SIZE) {
          throw new Error("Document must be under 10MB.")
        }
      }
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const ext = getExtension(file.filename)
        const key = `${r2Root}/temp/custom-fields/${generateId("file")}${ext ? `.${ext}` : ""}`
        const presignedUrl = await createPresignedUploadUrl(
          key,
          file.contentType,
        )
        return { key, presignedUrl }
      }),
    )

    return { files: results }
  })
