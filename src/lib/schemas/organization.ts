import { z } from "zod/v4"
import { slugSchema, slugSchemaStrict } from "./slug"

export const createOrgFormSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required.").max(100),
  slug: slugSchema,
})

export const createOrgActionSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required.").max(100),
  slug: slugSchemaStrict.optional(),
})

export const updateOrgFormSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required.").max(100),
  slug: slugSchema,
  description: z.string().trim().max(10000),
  websiteUrl: z.string().trim().pipe(z.url()).or(z.literal("")),
  logo: z.string().pipe(z.url()).or(z.literal("")).nullable().optional(),
  isOrganizationProfileOpen: z.boolean(),
})

export const updateOrgActionSchema = updateOrgFormSchema.extend({
  organizationId: z.string().min(1),
  slug: slugSchemaStrict.optional(),
})

export const inviteFormSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "Enter a valid email." })),
  role: z.enum(["admin", "member"]),
})

export const inviteActionSchema = inviteFormSchema.extend({
  organizationId: z.string().min(1),
})
