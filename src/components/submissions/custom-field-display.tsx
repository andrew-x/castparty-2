"use client"

import { Checkbox } from "@/components/common/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"
import { Switch } from "@/components/common/switch"
import { Textarea } from "@/components/common/textarea"
import type { CustomForm } from "@/lib/types"

interface Props {
  field: CustomForm
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: { message?: string }
  id?: string
}

export function CustomFieldDisplay({
  field,
  value,
  onChange,
  disabled,
  error,
  id,
}: Props) {
  const noop = () => {}
  const handleChange = onChange ?? noop

  switch (field.type) {
    case "TEXT":
      return (
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={id}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </FieldLabel>
          {field.description && (
            <FieldDescription>{field.description}</FieldDescription>
          )}
          <Input
            id={id}
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
          />
          {error && <FieldError errors={[error]} />}
        </Field>
      )

    case "TEXTAREA":
      return (
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={id}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </FieldLabel>
          {field.description && (
            <FieldDescription>{field.description}</FieldDescription>
          )}
          <Textarea
            id={id}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
          />
          {error && <FieldError errors={[error]} />}
        </Field>
      )

    case "SELECT":
      return (
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={id}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </FieldLabel>
          {field.description && (
            <FieldDescription>{field.description}</FieldDescription>
          )}
          <Select
            value={value}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={id}
              className="w-full"
              aria-invalid={error ? true : undefined}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <FieldError errors={[error]} />}
        </Field>
      )

    case "CHECKBOX_GROUP": {
      const selected = value ? value.split(",") : []
      function toggle(option: string) {
        const next = selected.includes(option)
          ? selected.filter((s) => s !== option)
          : [...selected, option]
        handleChange(next.join(","))
      }
      return (
        <FieldSet data-invalid={error ? true : undefined}>
          <FieldLegend variant="label">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </FieldLegend>
          {field.description && (
            <FieldDescription>{field.description}</FieldDescription>
          )}
          <div className="flex flex-col gap-element">
            {field.options.map((option) => (
              <FieldLabel
                key={option}
                className="flex items-center gap-2 text-label"
              >
                <Checkbox
                  checked={selected.includes(option)}
                  onCheckedChange={() => toggle(option)}
                  disabled={disabled}
                />
                {option}
              </FieldLabel>
            ))}
          </div>
          {error && <FieldError errors={[error]} />}
        </FieldSet>
      )
    }

    case "TOGGLE":
      return (
        <Field orientation="horizontal" data-invalid={error ? true : undefined}>
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor={id}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </FieldLabel>
            {field.description && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          </div>
          <Switch
            id={id}
            checked={value === "true"}
            onCheckedChange={(checked) =>
              handleChange(checked ? "true" : "false")
            }
            disabled={disabled}
          />
          {error && <FieldError errors={[error]} />}
        </Field>
      )

    default:
      return null
  }
}
