import { z } from "zod/v4"
import { RESERVED_SLUGS } from "@/lib/slug"

export const slugSchema = z
  .string()
  .trim()
  .min(3, "URL ID must be at least 3 characters.")
  .max(60, "URL ID must be at most 60 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Lowercase letters, numbers, and hyphens only.",
  )

export const slugSchemaStrict = slugSchema
  .refine((s) => !/^\d+$/.test(s), "URL ID cannot be purely numeric.")
  .refine((s) => !RESERVED_SLUGS.has(s), "This URL ID is reserved.")
