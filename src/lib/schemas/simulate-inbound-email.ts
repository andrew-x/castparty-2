import { z } from "zod/v4"

export const simulateInboundEmailFormSchema = z.object({
  submissionId: z.string().trim().min(1, "Submission ID is required."),
  fromEmail: z.string().trim().email("Enter a valid email."),
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  bodyText: z.string().trim().min(1, "Body is required.").max(5000),
})
