"use client"

import { FeedbackFormPreview } from "@/components/productions/feedback-form-preview"
import { FormFieldsEditor } from "@/components/productions/form-fields-editor"
import type { CustomForm, CustomFormFieldType } from "@/lib/types"

interface Props {
  fields: CustomForm[]
  onAdd: (type: CustomFormFieldType, label: string) => void
  onSave: (fieldId: string, updates: Partial<CustomForm>) => void
  onRemove: (fieldId: string) => void
  onReorder: (reordered: CustomForm[]) => void
  isAdding?: boolean
  isSaving?: boolean
  removingFieldId?: string | null
  description?: string
}

export function FeedbackFormBuilder({
  fields,
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
      <div>
        <FormFieldsEditor
          fields={fields}
          onAdd={onAdd}
          onSave={onSave}
          onRemove={onRemove}
          onReorder={onReorder}
          isAdding={isAdding}
          isSaving={isSaving}
          removingFieldId={removingFieldId}
          description={description}
          excludeTypes={["IMAGE", "DOCUMENT"]}
        />
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-4">
          <FeedbackFormPreview customFields={fields} />
        </div>
      </div>
    </div>
  )
}
