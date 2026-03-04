import { z } from "zod/v4"
import { slugSchema, slugSchemaStrict } from "./slug"

export const roleItemSchema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim().optional(),
})

export const createProductionFormSchema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
  description: z.string().trim().optional(),
  slug: slugSchemaStrict.optional().or(z.literal("")),
  roles: z.array(roleItemSchema),
})

export const createProductionActionSchema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
  description: z.string().trim().optional(),
  slug: slugSchema.optional(),
  customStages: z.array(z.string().trim().min(1).max(100)).optional(),
  roles: z.array(roleItemSchema).optional(),
})

export const updateProductionFormSchema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
  slug: slugSchema,
  isOpen: z.boolean(),
})

export const updateProductionActionSchema = updateProductionFormSchema.extend({
  productionId: z.string().min(1),
  slug: slugSchemaStrict,
  isOpen: z.boolean().optional(),
})
