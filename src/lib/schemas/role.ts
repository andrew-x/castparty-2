import { z } from "zod/v4"
import { productionStatusSchema } from "./production"
import { slugSchemaStrict } from "./slug"

export const createRoleFormSchema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim().optional(),
})

export const createRoleActionSchema = createRoleFormSchema.extend({
  productionId: z.string().min(1),
})

export const updateRoleFormSchema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  status: productionStatusSchema,
  description: z.string().trim().optional().default(""),
  referencePhotos: z.array(z.string().url()).max(3).optional(),
})

export const updateRoleActionSchema = z.object({
  roleId: z.string().min(1),
  name: z.string().trim().min(1, "Role name is required.").max(100).optional(),
  description: z.string().trim().optional(),
  slug: slugSchemaStrict.optional(),
  status: productionStatusSchema.optional(),
  referencePhotos: z.array(z.string().url()).max(3).optional(),
})
