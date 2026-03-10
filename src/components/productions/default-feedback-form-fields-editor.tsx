"use client"

import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useState } from "react"
import { addProductionFeedbackFormField } from "@/actions/productions/add-production-feedback-form-field"
import { removeProductionFeedbackFormField } from "@/actions/productions/remove-production-feedback-form-field"
import { reorderProductionFeedbackFormFields } from "@/actions/productions/reorder-production-feedback-form-fields"
import { updateProductionFeedbackFormField } from "@/actions/productions/update-production-feedback-form-field"
import { FormFieldsEditor } from "@/components/productions/form-fields-editor"
import type { CustomForm, CustomFormFieldType } from "@/lib/types"

interface Props {
  productionId: string
  fields: CustomForm[]
}

export function DefaultFeedbackFormFieldsEditor({
  productionId,
  fields,
}: Props) {
  const router = useRouter()
  const [localFields, setLocalFields] = useState(fields)

  useEffect(() => {
    setLocalFields(fields)
    setRemovingFieldId(null)
  }, [fields])

  const { execute: executeReorder } = useAction(
    reorderProductionFeedbackFormFields,
    {
      onError() {
        router.refresh()
      },
    },
  )

  const { execute: executeAdd, isPending: isAdding } = useAction(
    addProductionFeedbackFormField,
    {
      onSuccess() {
        router.refresh()
      },
    },
  )

  const [removingFieldId, setRemovingFieldId] = useState<string | null>(null)

  const { execute: executeRemove } = useAction(
    removeProductionFeedbackFormField,
    {
      onSuccess() {
        setRemovingFieldId(null)
        router.refresh()
      },
      onError() {
        setRemovingFieldId(null)
        router.refresh()
      },
    },
  )

  const { execute: executeUpdate, isPending: isSaving } = useAction(
    updateProductionFeedbackFormField,
    {
      onSuccess() {
        router.refresh()
      },
      onError() {
        router.refresh()
      },
    },
  )

  function handleAdd(type: CustomFormFieldType, label: string) {
    executeAdd({ productionId, type, label })
  }

  function handleSave(fieldId: string, updates: Partial<CustomForm>) {
    setLocalFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    )
    executeUpdate({ productionId, fieldId, ...updates })
  }

  function handleRemove(fieldId: string) {
    setRemovingFieldId(fieldId)
    setLocalFields((prev) => prev.filter((f) => f.id !== fieldId))
    executeRemove({ productionId, fieldId })
  }

  function handleReorder(reordered: CustomForm[]) {
    setLocalFields(reordered)
    executeReorder({ productionId, fieldIds: reordered.map((f) => f.id) })
  }

  return (
    <FormFieldsEditor
      fields={localFields}
      onAdd={handleAdd}
      onSave={handleSave}
      onRemove={handleRemove}
      onReorder={handleReorder}
      isAdding={isAdding}
      isSaving={isSaving}
      removingFieldId={removingFieldId}
      description="Changes here only apply to new roles. Existing roles are not affected."
    />
  )
}
