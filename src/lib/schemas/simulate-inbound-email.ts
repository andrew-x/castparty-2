import { z } from "zod/v4"

export const simulateInboundEmailFormSchema = z.object({
  toEmail: z
    .string()
    .trim()
    .min(1, "To address is required.")
    .regex(/^reply\+.+@.+$/, "Must be a reply address (reply+...@domain)."),
  fromEmail: z.string().trim().email("Enter a valid email."),
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  bodyText: z.string().trim().min(1, "Body is required.").max(5000),
})
