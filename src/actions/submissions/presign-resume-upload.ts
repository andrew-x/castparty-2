"use server"

import { z } from "zod/v4"
import { publicActionClient } from "@/lib/action"
import { createPresignedUploadUrl, r2Root } from "@/lib/r2"
import { generateId } from "@/lib/util"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().refine((v) => v === "application/pdf", {
    message: "Only PDF files are accepted.",
  }),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE, "Resume must be under 10MB."),
})

export const presignResumeUpload = publicActionClient
  .metadata({ action: "presign-resume-upload" })
  .inputSchema(presignSchema)
  .action(async ({ parsedInput: { contentType } }) => {
    const key = `${r2Root}/temp/resumes/${generateId("file")}.pdf`
    const presignedUrl = await createPresignedUploadUrl(key, contentType)
    return { key, presignedUrl }
  })
