import { z } from "zod/v4"

export const createUserFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

export const createUserActionSchema = createUserFormSchema.extend({
  email: z.string().trim().pipe(z.email()),
})
