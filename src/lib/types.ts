export type CustomFormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "SELECT"
  | "CHECKBOX_GROUP"
  | "TOGGLE"
export type CustomForm = {
  id: string
  type: CustomFormFieldType
  label: string
  description: string
  required: boolean
  options: string[] // For SELECT and CHECKBOX_GROUP types
}

export type CustomFormResponse = {
  fieldId: string
  textValue: string | null
  booleanValue: boolean | null
  optionValues: string[] | null
}
