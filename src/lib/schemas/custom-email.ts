import { z } from "zod/v4"

export const customEmailFormSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required.")
    .max(200, "Subject is too long."),
  body: z
    .string()
    .trim()
    .min(1, "Email body is required.")
    .max(5000, "Email body is too long."),
})

export const customEmailActionSchema = customEmailFormSchema.extend({
  submissionId: z.string().min(1),
})
