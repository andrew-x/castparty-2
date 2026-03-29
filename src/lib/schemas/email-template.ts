import { z } from "zod/v4"

export const emailTemplateSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  body: z.string().trim().min(1, "Body is required.").max(5000),
})

export const emailTemplatesSchema = z.object({
  submissionReceived: emailTemplateSchema,
  rejected: emailTemplateSchema,
  selected: emailTemplateSchema,
})

export const updateEmailTemplatesFormSchema = z.object({
  emailTemplates: emailTemplatesSchema,
})

export const updateEmailTemplatesActionSchema =
  updateEmailTemplatesFormSchema.extend({
    productionId: z.string().min(1),
  })

export type UpdateEmailTemplatesInput = z.infer<
  typeof updateEmailTemplatesActionSchema
>
