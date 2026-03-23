import { z } from "zod/v4"

export const customFormFieldTypeSchema = z.enum([
  "TEXT",
  "TEXTAREA",
  "SELECT",
  "CHECKBOX_GROUP",
  "TOGGLE",
])

export const customFormItemSchema = z.object({
  id: z.string().min(1),
  type: customFormFieldTypeSchema,
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500),
  required: z.boolean(),
  options: z.array(z.string().max(200)),
})

// --- Production form field actions ---

export const addProductionFormFieldSchema = z.object({
  productionId: z.string().min(1),
  type: customFormFieldTypeSchema,
  label: z.string().trim().min(1, "Label is required.").max(200),
})

export const updateProductionFormFieldSchema = z.object({
  productionId: z.string().min(1),
  fieldId: z.string().min(1),
  label: z.string().trim().min(1, "Label is required.").max(200).optional(),
  description: z.string().trim().max(500).optional(),
  required: z.boolean().optional(),
  options: z
    .array(z.string().trim().min(1, "Option text is required.").max(200))
    .optional(),
})

export const removeProductionFormFieldSchema = z.object({
  productionId: z.string().min(1),
  fieldId: z.string().min(1),
})

export const reorderProductionFormFieldsSchema = z.object({
  productionId: z.string().min(1),
  fieldIds: z.array(z.string().min(1)).min(1),
})

// --- System field config ---

export const systemFieldVisibilitySchema = z.enum([
  "hidden",
  "optional",
  "required",
])

export const systemFieldConfigSchema = z.object({
  phone: systemFieldVisibilitySchema,
  location: systemFieldVisibilitySchema,
  headshots: systemFieldVisibilitySchema,
  resume: systemFieldVisibilitySchema,
  links: systemFieldVisibilitySchema,
})

export const updateProductionSystemFieldConfigSchema = z.object({
  productionId: z.string().min(1),
  systemFieldConfig: systemFieldConfigSchema,
})

// --- Production feedback form field actions ---

export const addProductionFeedbackFormFieldSchema = z.object({
  productionId: z.string().min(1),
  type: customFormFieldTypeSchema,
  label: z.string().trim().min(1, "Label is required.").max(200),
})

export const updateProductionFeedbackFormFieldSchema = z.object({
  productionId: z.string().min(1),
  fieldId: z.string().min(1),
  label: z.string().trim().min(1, "Label is required.").max(200).optional(),
  description: z.string().trim().max(500).optional(),
  required: z.boolean().optional(),
  options: z
    .array(z.string().trim().min(1, "Option text is required.").max(200))
    .optional(),
})

export const removeProductionFeedbackFormFieldSchema = z.object({
  productionId: z.string().min(1),
  fieldId: z.string().min(1),
})

export const reorderProductionFeedbackFormFieldsSchema = z.object({
  productionId: z.string().min(1),
  fieldIds: z.array(z.string().min(1)).min(1),
})
