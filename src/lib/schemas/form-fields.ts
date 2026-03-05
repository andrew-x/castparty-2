import { z } from "zod/v4"

export const customFormFieldTypeSchema = z.enum([
  "TEXT",
  "TEXTAREA",
  "SELECT",
  "CHECKBOX_GROUP",
  "TOGGLE",
])

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

// --- Role form field actions ---

export const addRoleFormFieldSchema = z.object({
  roleId: z.string().min(1),
  type: customFormFieldTypeSchema,
  label: z.string().trim().min(1, "Label is required.").max(200),
})

export const updateRoleFormFieldSchema = z.object({
  roleId: z.string().min(1),
  fieldId: z.string().min(1),
  label: z.string().trim().min(1, "Label is required.").max(200).optional(),
  description: z.string().trim().max(500).optional(),
  required: z.boolean().optional(),
  options: z
    .array(z.string().trim().min(1, "Option text is required.").max(200))
    .optional(),
})

export const removeRoleFormFieldSchema = z.object({
  roleId: z.string().min(1),
  fieldId: z.string().min(1),
})

export const reorderRoleFormFieldsSchema = z.object({
  roleId: z.string().min(1),
  fieldIds: z.array(z.string().min(1)).min(1),
})
