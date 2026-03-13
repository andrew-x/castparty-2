"use client"

import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useState } from "react"
import { addRoleFeedbackFormField } from "@/actions/productions/add-role-feedback-form-field"
import { removeRoleFeedbackFormField } from "@/actions/productions/remove-role-feedback-form-field"
import { reorderRoleFeedbackFormFields } from "@/actions/productions/reorder-role-feedback-form-fields"
import { updateRoleFeedbackFormField } from "@/actions/productions/update-role-feedback-form-field"
import { FeedbackFormBuilder } from "@/components/productions/feedback-form-builder"
import type { CustomForm, CustomFormFieldType } from "@/lib/types"

interface Props {
  roleId: string
  fields: CustomForm[]
}

export function RoleFeedbackFormFieldsEditor({ roleId, fields }: Props) {
  const router = useRouter()
  const [localFields, setLocalFields] = useState(fields)

  useEffect(() => {
    setLocalFields(fields)
    setRemovingFieldId(null)
  }, [fields])

  const { execute: executeReorder } = useAction(reorderRoleFeedbackFormFields, {
    onError() {
      router.refresh()
    },
  })

  const { execute: executeAdd, isPending: isAdding } = useAction(
    addRoleFeedbackFormField,
    {
      onSuccess() {
        router.refresh()
      },
    },
  )

  const [removingFieldId, setRemovingFieldId] = useState<string | null>(null)

  const { execute: executeRemove } = useAction(removeRoleFeedbackFormField, {
    onSuccess() {
      setRemovingFieldId(null)
      router.refresh()
    },
    onError() {
      setRemovingFieldId(null)
      router.refresh()
    },
  })

  const { execute: executeUpdate, isPending: isSaving } = useAction(
    updateRoleFeedbackFormField,
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
    executeAdd({ roleId, type, label })
  }

  function handleSave(fieldId: string, updates: Partial<CustomForm>) {
    setLocalFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    )
    executeUpdate({ roleId, fieldId, ...updates })
  }

  function handleRemove(fieldId: string) {
    setRemovingFieldId(fieldId)
    setLocalFields((prev) => prev.filter((f) => f.id !== fieldId))
    executeRemove({ roleId, fieldId })
  }

  function handleReorder(reordered: CustomForm[]) {
    setLocalFields(reordered)
    executeReorder({ roleId, fieldIds: reordered.map((f) => f.id) })
  }

  return (
    <FeedbackFormBuilder
      fields={localFields}
      onAdd={handleAdd}
      onSave={handleSave}
      onRemove={handleRemove}
      onReorder={handleReorder}
      isAdding={isAdding}
      isSaving={isSaving}
      removingFieldId={removingFieldId}
    />
  )
}
