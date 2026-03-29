export type CustomFormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "SELECT"
  | "CHECKBOX_GROUP"
  | "TOGGLE"
export interface CustomForm {
  id: string
  type: CustomFormFieldType
  label: string
  description: string
  required: boolean
  options: string[] // For SELECT and CHECKBOX_GROUP types
}

export interface CustomFormResponse {
  fieldId: string
  textValue: string | null
  booleanValue: boolean | null
  optionValues: string[] | null
}

export type SystemFieldVisibility = "hidden" | "optional" | "required"

export interface SystemFieldConfig {
  phone: SystemFieldVisibility
  location: SystemFieldVisibility
  headshots: SystemFieldVisibility
  resume: SystemFieldVisibility
  links: SystemFieldVisibility
}

export const DEFAULT_SYSTEM_FIELD_CONFIG: SystemFieldConfig = {
  phone: "optional",
  location: "optional",
  headshots: "optional",
  resume: "optional",
  links: "optional",
}

export const SYSTEM_FIELD_LABELS: Record<keyof SystemFieldConfig, string> = {
  phone: "Phone number",
  location: "Location",
  headshots: "Headshots",
  resume: "Resume",
  links: "Links",
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
