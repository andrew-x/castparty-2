import { z } from "zod/v4"

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(1, "Password is required."),
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "Enter a valid email address." })),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
})
