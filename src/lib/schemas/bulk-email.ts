import { z } from "zod/v4"

export const bulkEmailFormSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  body: z.string().trim().min(1, "Body is required.").max(5000),
})

export const bulkEmailActionSchema = bulkEmailFormSchema.extend({
  submissionIds: z.array(z.string().min(1)).min(1).max(100),
})
