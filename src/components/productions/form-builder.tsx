"use client"

import { FormFieldsEditor } from "@/components/productions/form-fields-editor"
import { SubmissionFormPreview } from "@/components/productions/submission-form-preview"
import { SystemFieldToggles } from "@/components/productions/system-field-toggles"
import type {
  CustomForm,
  CustomFormFieldType,
  SystemFieldConfig,
} from "@/lib/types"

interface Props {
  systemFieldConfig: SystemFieldConfig
  customFields: CustomForm[]
  onSystemFieldConfigChange: (config: SystemFieldConfig) => void
  onAdd: (type: CustomFormFieldType, label: string) => void
  onSave: (fieldId: string, updates: Partial<CustomForm>) => void
  onRemove: (fieldId: string) => void
  onReorder: (reordered: CustomForm[]) => void
  isAdding?: boolean
  isSaving?: boolean
  removingFieldId?: string | null
  description?: string
}

export function FormBuilder({
  systemFieldConfig,
  customFields,
  onSystemFieldConfigChange,
  onAdd,
  onSave,
  onRemove,
  onReorder,
  isAdding,
  isSaving,
  removingFieldId,
  description,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-section lg:grid-cols-[1fr_440px]">
      <div className="flex flex-col gap-group">
        <SystemFieldToggles
          config={systemFieldConfig}
          onChange={onSystemFieldConfigChange}
        />
        <div>
          <h3 className="mb-group font-serif text-heading">Custom fields</h3>
          <FormFieldsEditor
            fields={customFields}
            onAdd={onAdd}
            onSave={onSave}
            onRemove={onRemove}
            onReorder={onReorder}
            isAdding={isAdding}
            isSaving={isSaving}
            removingFieldId={removingFieldId}
            description={description}
          />
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-4">
          <SubmissionFormPreview
            systemFieldConfig={systemFieldConfig}
            customFields={customFields}
          />
        </div>
      </div>
    </div>
  )
}
