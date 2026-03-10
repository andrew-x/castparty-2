"use client"

import { move } from "@dnd-kit/helpers"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { GripVerticalIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useState } from "react"
import { addProductionFormField } from "@/actions/productions/add-production-form-field"
import { removeProductionFormField } from "@/actions/productions/remove-production-form-field"
import { reorderProductionFormFields } from "@/actions/productions/reorder-production-form-fields"
import { updateProductionFormField } from "@/actions/productions/update-production-form-field"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { Input } from "@/components/common/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"
import { Switch } from "@/components/common/switch"
import type { CustomForm, CustomFormFieldType } from "@/lib/types"

const FIELD_TYPE_LABELS: Record<CustomFormFieldType, string> = {
  TEXT: "Text",
  TEXTAREA: "Long text",
  SELECT: "Select",
  CHECKBOX_GROUP: "Checkbox group",
  TOGGLE: "Toggle",
}

// --- Options editor for SELECT/CHECKBOX_GROUP ---

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[]
  onChange: (options: string[]) => void
}) {
  function handleOptionChange(index: number, value: string) {
    const updated = [...options]
    updated[index] = value
    onChange(updated)
  }

  function handleRemoveOption(index: number) {
    onChange(options.filter((_, i) => i !== index))
  }

  function handleAddOption() {
    onChange([...options, ""])
  }

  return (
    <div className="flex flex-col gap-element">
      <span className="font-medium text-caption text-muted-foreground">
        Options
      </span>
      {options.map((option, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: options are plain strings without stable IDs
        <div key={index} className="flex items-center gap-element">
          <Input
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="h-7 flex-1 text-caption"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => handleRemoveOption(index)}
            disabled={options.length === 0}
            tooltip="Remove option"
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={handleAddOption}
        leftSection={<PlusIcon className="size-3" />}
      >
        Add option
      </Button>
    </div>
  )
}

// --- Draft state for the expanded editor ---

type FieldDraft = {
  label: string
  description: string
  required: boolean
  options: string[]
}

function draftFromField(field: CustomForm): FieldDraft {
  return {
    label: field.label,
    description: field.description,
    required: field.required,
    options: [...field.options],
  }
}

// --- Sortable field row ---

function SortableField({
  field,
  index,
  isExpanded,
  onToggleExpand,
  onSave,
  onRemove,
  isRemoving,
  isSaving,
}: {
  field: CustomForm
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onSave: (fieldId: string, updates: Partial<CustomForm>) => void
  onRemove: (fieldId: string) => void
  isRemoving?: boolean
  isSaving?: boolean
}) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: field.id,
    index,
  })

  const [draft, setDraft] = useState<FieldDraft>(draftFromField(field))

  // Reset draft when expanding (in case the field changed since last expand)
  function handleToggle() {
    if (!isExpanded) {
      setDraft(draftFromField(field))
    }
    onToggleExpand()
  }

  function handleSave() {
    onSave(field.id, {
      label: draft.label,
      description: draft.description,
      required: draft.required,
      options: draft.options,
    })
  }

  const hasChanges =
    draft.label !== field.label ||
    draft.description !== field.description ||
    draft.required !== field.required ||
    JSON.stringify(draft.options) !== JSON.stringify(field.options)

  return (
    <div
      ref={ref}
      className="border-b last:border-b-0"
      style={{ opacity: isDragSource ? 0.4 : 1 }}
    >
      {/* Collapsed row — read-only summary */}
      <div className="flex items-center gap-element px-3 py-1.5">
        <button
          ref={handleRef}
          type="button"
          aria-label="Drag to reorder"
          className="flex cursor-grab items-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-4" />
        </button>

        <Badge variant="secondary" className="shrink-0 text-caption">
          {FIELD_TYPE_LABELS[field.type]}
        </Badge>

        <span className="flex-1 truncate text-foreground text-label">
          {field.label}
          {field.required && <span className="text-destructive"> *</span>}
        </span>

        {(field.type === "SELECT" || field.type === "CHECKBOX_GROUP") && (
          <span className="shrink-0 text-caption text-muted-foreground">
            {field.options.length}{" "}
            {field.options.length === 1 ? "option" : "options"}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={handleToggle}
          tooltip={isExpanded ? "Close editor" : "Edit field"}
        >
          <PencilIcon className="size-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => onRemove(field.id)}
          disabled={isRemoving}
          tooltip="Remove field"
        >
          <XIcon className="size-3" />
        </Button>
      </div>

      {/* Expanded editor */}
      {isExpanded && (
        <div className="flex flex-col gap-block border-t bg-muted/30 px-3 py-3 pl-10">
          <div className="flex flex-col gap-element">
            <span className="font-medium text-caption text-muted-foreground">
              Label
            </span>
            <Input
              type="text"
              value={draft.label}
              onChange={(e) =>
                setDraft((d) => ({ ...d, label: e.target.value }))
              }
              placeholder="Field label"
              className="h-7 text-label"
            />
          </div>

          <div className="flex flex-col gap-element">
            <span className="font-medium text-caption text-muted-foreground">
              Description
            </span>
            <Input
              type="text"
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              placeholder="Help text shown below the field"
              className="h-7 text-caption"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Switch
              size="sm"
              checked={draft.required}
              onCheckedChange={(checked) =>
                setDraft((d) => ({ ...d, required: checked === true }))
              }
            />
            <span className="text-caption text-muted-foreground">Required</span>
          </div>

          {(field.type === "SELECT" || field.type === "CHECKBOX_GROUP") && (
            <OptionsEditor
              options={draft.options}
              onChange={(options) => setDraft((d) => ({ ...d, options }))}
            />
          )}

          <div className="flex items-center gap-element pt-1">
            <Button
              variant="default"
              size="xs"
              onClick={handleSave}
              loading={isSaving}
              disabled={!hasChanges || !draft.label.trim()}
            >
              Save
            </Button>
            <Button variant="ghost" size="xs" onClick={handleToggle}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Controlled FormFieldsEditor ---

interface FormFieldsEditorProps {
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

export function FormFieldsEditor({
  fields,
  onAdd,
  onSave,
  onRemove,
  onReorder,
  isAdding,
  isSaving,
  removingFieldId,
  description,
}: FormFieldsEditorProps) {
  const [newFieldType, setNewFieldType] = useState<CustomFormFieldType>("TEXT")
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null)

  function handleDragEnd(event: Parameters<DragEndEvent>[0]) {
    if (event.canceled) return
    const reordered = move(fields, event)
    onReorder(reordered)
  }

  function handleAdd() {
    const trimmed = newFieldLabel.trim()
    if (!trimmed) return
    onAdd(newFieldType, trimmed)
    setNewFieldLabel("")
  }

  function toggleExpand(fieldId: string) {
    setExpandedFieldId((prev) => (prev === fieldId ? null : fieldId))
  }

  return (
    <div className="flex flex-col gap-group">
      {description && (
        <p className="text-label text-muted-foreground">{description}</p>
      )}

      <div className="flex flex-col rounded-lg border">
        {fields.length > 0 ? (
          <DragDropProvider onDragEnd={handleDragEnd}>
            {fields.map((field, index) => (
              <SortableField
                key={field.id}
                field={field}
                index={index}
                isExpanded={expandedFieldId === field.id}
                onToggleExpand={() => toggleExpand(field.id)}
                onSave={onSave}
                onRemove={onRemove}
                isRemoving={removingFieldId === field.id}
                isSaving={isSaving}
              />
            ))}
          </DragDropProvider>
        ) : (
          <p className="px-3 py-2 text-caption text-muted-foreground">
            No custom fields yet.
          </p>
        )}

        <div className="flex items-center gap-element border-t px-3 py-2">
          <Select
            value={newFieldType}
            onValueChange={(v) => setNewFieldType(v as CustomFormFieldType)}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(FIELD_TYPE_LABELS) as [
                  CustomFormFieldType,
                  string,
                ][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="Field label"
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAdd()
              }
            }}
            className="h-8 flex-1"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            loading={isAdding}
            disabled={!newFieldLabel.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- DefaultFormFieldsEditor (production settings wrapper) ---

interface DefaultFormFieldsEditorProps {
  productionId: string
  fields: CustomForm[]
}

export function DefaultFormFieldsEditor({
  productionId,
  fields,
}: DefaultFormFieldsEditorProps) {
  const router = useRouter()
  const [localFields, setLocalFields] = useState(fields)

  useEffect(() => {
    setLocalFields(fields)
    setRemovingFieldId(null)
  }, [fields])

  const { execute: executeReorder } = useAction(reorderProductionFormFields, {
    onError() {
      router.refresh()
    },
  })

  const { execute: executeAdd, isPending: isAdding } = useAction(
    addProductionFormField,
    {
      onSuccess() {
        router.refresh()
      },
    },
  )

  const [removingFieldId, setRemovingFieldId] = useState<string | null>(null)

  const { execute: executeRemove } = useAction(removeProductionFormField, {
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
    updateProductionFormField,
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
