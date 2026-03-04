import { z } from "zod/v4"

export const submissionFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional(),
})

export const submissionActionSchema = submissionFormSchema.extend({
  orgId: z.string().min(1),
  productionId: z.string().min(1),
  roleId: z.string().min(1),
})
