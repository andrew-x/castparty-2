export type CustomFormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "SELECT"
  | "CHECKBOX_GROUP"
  | "TOGGLE"
  | "IMAGE"
  | "DOCUMENT"
export interface CustomForm {
  id: string
  type: CustomFormFieldType
  label: string
  description: string
  required: boolean
  options: string[] // For SELECT and CHECKBOX_GROUP types
  maxFiles?: number // For IMAGE fields (default 5)
}

export interface CustomFormResponse {
  fieldId: string
  textValue: string | null
  booleanValue: boolean | null
  optionValues: string[] | null
  fileValues: string[] | null
}

export type SystemFieldVisibility = "hidden" | "optional" | "required"
export type RestrictedFieldVisibility = "hidden" | "optional"

export interface SystemFieldConfig {
  phone: SystemFieldVisibility
  location: SystemFieldVisibility
  headshots: SystemFieldVisibility
  resume: SystemFieldVisibility
  video: SystemFieldVisibility
  links: RestrictedFieldVisibility
  unionStatus: RestrictedFieldVisibility
  representation: RestrictedFieldVisibility
}

export const DEFAULT_SYSTEM_FIELD_CONFIG: SystemFieldConfig = {
  phone: "optional",
  location: "optional",
  headshots: "optional",
  resume: "optional",
  video: "hidden",
  links: "optional",
  unionStatus: "hidden",
  representation: "hidden",
}

export const SYSTEM_FIELD_LABELS: Record<keyof SystemFieldConfig, string> = {
  phone: "Phone number",
  location: "Location",
  headshots: "Headshots",
  resume: "Resume",
  video: "Video",
  links: "Links",
  unionStatus: "Union status",
  representation: "Representation",
}

export const SYSTEM_FIELD_ALLOWED_VISIBILITIES: Record<
  keyof SystemFieldConfig,
  SystemFieldVisibility[]
> = {
  phone: ["hidden", "optional", "required"],
  location: ["hidden", "optional", "required"],
  headshots: ["hidden", "optional", "required"],
  resume: ["hidden", "optional", "required"],
  video: ["hidden", "optional", "required"],
  links: ["hidden", "optional"],
  unionStatus: ["hidden", "optional"],
  representation: ["hidden", "optional"],
}

export const UNION_OPTIONS = [
  "AEA",
  "EMC",
  "SAG-AFTRA",
  "CAEA",
  "ACTRA",
  "AGMA",
  "UDA",
] as const

export interface Representation {
  name: string
  email: string
  phone: string
}

export interface EmailTemplate {
  subject: string
  body: string
}

export interface EmailTemplates {
  submissionReceived: EmailTemplate
  rejected: EmailTemplate
  selected: EmailTemplate
}
