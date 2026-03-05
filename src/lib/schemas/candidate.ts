import { z } from "zod/v4"

export const updateCandidateFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
})

export const updateCandidateActionSchema = updateCandidateFormSchema.extend({
  candidateId: z.string().min(1),
})
