import { z } from "zod/v4"
import { feedbackRatingEnum } from "@/lib/db/schema"

export const createFeedbackFormSchema = z.object({
  rating: z.enum(feedbackRatingEnum.enumValues, {
    error: "Select a rating.",
  }),
  notes: z.string().trim().max(5000).optional().default(""),
  answers: z.record(z.string(), z.string().trim()).default({}),
})

export const createFeedbackActionSchema = createFeedbackFormSchema.extend({
  submissionId: z.string().min(1),
  stageId: z.string().min(1),
})
