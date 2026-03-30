"use client"

import { useState } from "react"
import { Field, FieldError, FieldLabel } from "@/components/common/field"
import { Input } from "@/components/common/input"
import { Label } from "@/components/common/label"
import { Switch } from "@/components/common/switch"
import type { Representation } from "@/lib/types"

interface Props {
  value: Representation | null
  onChange: (v: Representation | null) => void
  disabled?: boolean
  errors?: {
    name?: { message?: string }
    email?: { message?: string }
  }
}

export function RepresentationFields({
  value,
  onChange,
  disabled,
  errors,
}: Props) {
  const [name, setName] = useState(value?.name ?? "")
  const [email, setEmail] = useState(value?.email ?? "")
  const [phone, setPhone] = useState(value?.phone ?? "")

  const isOn = value !== null

  function handleToggle(checked: boolean) {
    if (checked) {
      onChange({ name, email, phone })
    } else {
      onChange(null)
    }
  }

  function handleFieldChange(field: keyof Representation, fieldValue: string) {
    const next = { name, email, phone, [field]: fieldValue }
    if (field === "name") setName(fieldValue)
    if (field === "email") setEmail(fieldValue)
    if (field === "phone") setPhone(fieldValue)
    if (isOn) onChange(next)
  }

  return (
    <div className="flex flex-col gap-element">
      <Label className="flex cursor-pointer items-center gap-2">
        <Switch
          checked={isOn}
          onCheckedChange={handleToggle}
          disabled={disabled}
        />
        <span className="text-label">I have an agent or manager</span>
      </Label>

      {isOn && (
        <div className="flex flex-col gap-3 rounded-md border p-3">
          <Field data-invalid={errors?.name ? true : undefined}>
            <FieldLabel>Agent/agency name</FieldLabel>
            <Input
              type="text"
              value={name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              disabled={disabled}
              placeholder="e.g. Creative Artists Agency"
              aria-invalid={!!errors?.name}
            />
            {errors?.name?.message && (
              <FieldError>{errors.name.message}</FieldError>
            )}
          </Field>
          <Field data-invalid={errors?.email ? true : undefined}>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              disabled={disabled}
              placeholder="agent@example.com"
              aria-invalid={!!errors?.email}
            />
            {errors?.email?.message && (
              <FieldError>{errors.email.message}</FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel>Phone (optional)</FieldLabel>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              disabled={disabled}
              placeholder="+1 (555) 000-0000"
            />
          </Field>
        </div>
      )}
    </div>
  )
}
