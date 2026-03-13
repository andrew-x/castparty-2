"use client"

import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useState } from "react"
import { addRoleFormField } from "@/actions/productions/add-role-form-field"
import { removeRoleFormField } from "@/actions/productions/remove-role-form-field"
import { reorderRoleFormFields } from "@/actions/productions/reorder-role-form-fields"
import { updateRoleFormField } from "@/actions/productions/update-role-form-field"
import { updateRoleSystemFieldConfig } from "@/actions/productions/update-role-system-field-config"
import { FormBuilder } from "@/components/productions/form-builder"
import type {
  CustomForm,
  CustomFormFieldType,
  SystemFieldConfig,
} from "@/lib/types"
import { DEFAULT_SYSTEM_FIELD_CONFIG } from "@/lib/types"

interface Props {
  roleId: string
  fields: CustomForm[]
  systemFieldConfig?: SystemFieldConfig
}

export function RoleFormFieldsEditor({
  roleId,
  fields,
  systemFieldConfig: initialSystemFieldConfig,
}: Props) {
  const router = useRouter()
  const [localFields, setLocalFields] = useState(fields)
  const [localSystemFieldConfig, setLocalSystemFieldConfig] =
    useState<SystemFieldConfig>(
      initialSystemFieldConfig ?? DEFAULT_SYSTEM_FIELD_CONFIG,
    )

  useEffect(() => {
    setLocalFields(fields)
    setRemovingFieldId(null)
  }, [fields])

  useEffect(() => {
    if (initialSystemFieldConfig) {
      setLocalSystemFieldConfig(initialSystemFieldConfig)
    }
  }, [initialSystemFieldConfig])

  const { execute: executeUpdateSystemFieldConfig } = useAction(
    updateRoleSystemFieldConfig,
    {
      onError() {
        router.refresh()
      },
    },
  )

  const { execute: executeReorder } = useAction(reorderRoleFormFields, {
    onError() {
      router.refresh()
    },
  })

  const { execute: executeAdd, isPending: isAdding } = useAction(
    addRoleFormField,
    {
      onSuccess() {
        router.refresh()
      },
    },
  )

  const [removingFieldId, setRemovingFieldId] = useState<string | null>(null)

  const { execute: executeRemove } = useAction(removeRoleFormField, {
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
    updateRoleFormField,
    {
      onSuccess() {
        router.refresh()
      },
      onError() {
        router.refresh()
      },
    },
  )

  function handleSystemFieldConfigChange(config: SystemFieldConfig) {
    setLocalSystemFieldConfig(config)
    executeUpdateSystemFieldConfig({ roleId, systemFieldConfig: config })
  }

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
    <FormBuilder
      systemFieldConfig={localSystemFieldConfig}
      customFields={localFields}
      onSystemFieldConfigChange={handleSystemFieldConfigChange}
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
