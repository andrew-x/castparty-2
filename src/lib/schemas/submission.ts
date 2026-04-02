import { z } from "zod/v4"

/** URL that must use http: or https: scheme — blocks javascript:, data:, etc. */
const httpUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .refine(
    (v) => /^https?:\/\//i.test(v),
    "URL must start with http:// or https://",
  )

export const headShotFileSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024),
})

export const resumeFileSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
})

export const customFieldFileSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024),
})

export const representationSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(50).default(""),
})

export const submissionFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional(),
  location: z.string().trim().max(200).optional(),
  answers: z.record(z.string(), z.string()).default({}),
  links: z
    .preprocess(
      (val) =>
        Array.isArray(val)
          ? val.filter((v) => typeof v === "string" && v.trim())
          : [],
      z.array(httpUrl),
    )
    .default([]),
  videoUrl: httpUrl.or(z.literal("")).optional(),
  unionStatus: z.array(z.string().trim().min(1).max(100)).default([]),
  representation: representationSchema.nullable().default(null),
})

export const submissionActionSchema = submissionFormSchema.extend({
  orgId: z.string().min(1),
  productionId: z.string().min(1),
  roleIds: z.array(z.string().min(1)).min(1, "Select at least one role."),
  headshots: z.array(headShotFileSchema).max(10).default([]),
  resume: resumeFileSchema.optional(),
  customFieldFiles: z
    .record(z.string(), z.array(customFieldFileSchema))
    .default({}),
})

export const updateSubmissionStatusSchema = z.object({
  submissionId: z.string().min(1),
  stageId: z.string().min(1),
  rejectionReason: z.string().trim().min(1).max(500).optional(),
})

export const bulkUpdateSubmissionStatusSchema = z.object({
  submissionIds: z.array(z.string().min(1)).min(1).max(100),
  stageId: z.string().min(1),
  rejectionReason: z.string().trim().min(1).max(500).optional(),
})

export const updateSubmissionFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  links: z
    .preprocess(
      (val) =>
        Array.isArray(val)
          ? val.filter((v) => typeof v === "string" && v.trim())
          : [],
      z.array(httpUrl),
    )
    .default([]),
  videoUrl: httpUrl.or(z.literal("")).optional(),
  unionStatus: z.array(z.string().trim().min(1).max(100)).default([]),
  representation: representationSchema.nullable().default(null),
})

export const updateSubmissionActionSchema = updateSubmissionFormSchema.extend({
  submissionId: z.string().min(1),
  newHeadshots: z.array(headShotFileSchema).max(10).default([]),
  newResume: resumeFileSchema.optional(),
})

export const copySubmissionFormSchema = z.object({
  targetRoleId: z.string().min(1, "Select a role."),
})

export const copySubmissionActionSchema = copySubmissionFormSchema.extend({
  submissionId: z.string().min(1),
})
