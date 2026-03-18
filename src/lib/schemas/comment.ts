import { z } from "zod/v4"

export const createCommentFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(5000, "Comment is too long."),
})

export const createCommentActionSchema = createCommentFormSchema.extend({
  submissionId: z.string().min(1),
})
