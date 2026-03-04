export type CustomFormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "SELECT"
  | "MULTISELECT"
  | "CHECKBOX"
export type CustomForm = {
  id: string
  type: CustomFormFieldType
  label: string
  description: string
  required: boolean
  options: string[] // For SELECT and MULTISELECT types
}

export type CustomFormResponse = {
  fieldId: string
  textValue: string | null
  booleanValue: boolean | null
  optionValues: string[] | null
}
