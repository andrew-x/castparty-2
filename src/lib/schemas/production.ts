import { z } from "zod/v4"
import { MAX_PIPELINE_STAGES } from "@/lib/constants"
import { customFormItemSchema } from "./form-fields"
import { slugSchema, slugSchemaStrict } from "./slug"

export const roleItemSchema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim().optional(),
})

export const createProductionFormSchema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
  description: z.string().trim().optional(),
  location: z.string().trim().max(200).optional(),
  slug: slugSchemaStrict.optional().or(z.literal("")),
  roles: z.array(roleItemSchema),
})

export const createProductionActionSchema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
  description: z.string().trim().optional(),
  location: z.string().trim().max(200).optional(),
  slug: slugSchema.optional(),
  customStages: z
    .array(z.string().trim().min(1).max(100))
    .max(
      MAX_PIPELINE_STAGES - 3,
      `You can add at most ${MAX_PIPELINE_STAGES - 3} custom stages.`,
    )
    .optional(),
  roles: z.array(roleItemSchema).optional(),
  submissionFormFields: z.array(customFormItemSchema).optional(),
  feedbackFormFields: z.array(customFormItemSchema).optional(),
})

export const productionStatusSchema = z.enum(["open", "closed", "archive"])

export const updateProductionFormSchema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
  location: z.string().trim().max(200),
  slug: slugSchema,
  status: productionStatusSchema,
})

export const updateProductionActionSchema = updateProductionFormSchema.extend({
  productionId: z.string().min(1),
  slug: slugSchemaStrict,
  status: productionStatusSchema.optional(),
})
