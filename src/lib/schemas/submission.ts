import { z } from "zod/v4"

export const headShotFileSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024),
})

export const submissionFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional(),
  answers: z.record(z.string(), z.string()).default({}),
})

export const submissionActionSchema = submissionFormSchema.extend({
  orgId: z.string().min(1),
  productionId: z.string().min(1),
  roleId: z.string().min(1),
  headshots: z.array(headShotFileSchema).max(10).default([]),
})
