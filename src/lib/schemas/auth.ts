import { z } from "zod"

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
})
