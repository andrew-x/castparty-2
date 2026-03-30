"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/common/toggle-group"
import type { SystemFieldConfig, SystemFieldVisibility } from "@/lib/types"
import {
  SYSTEM_FIELD_ALLOWED_VISIBILITIES,
  SYSTEM_FIELD_LABELS,
} from "@/lib/types"

interface Props {
  config: SystemFieldConfig
  onChange: (config: SystemFieldConfig) => void
}

const VISIBILITY_OPTIONS: { value: SystemFieldVisibility; label: string }[] = [
  { value: "hidden", label: "Hidden" },
  { value: "optional", label: "Optional" },
  { value: "required", label: "Required" },
]

export function SystemFieldToggles({ config, onChange }: Props) {
  function handleChange(field: keyof SystemFieldConfig, value: string) {
    if (!value) return
    onChange({ ...config, [field]: value as SystemFieldVisibility })
  }

  return (
    <div className="flex flex-col gap-group">
      <div>
        <h3 className="font-serif text-heading">Standard fields</h3>
        <p className="text-label text-muted-foreground">
          First name, last name, and email are always required.
        </p>
      </div>
      <div className="flex flex-col gap-block rounded-lg border p-3">
        {(Object.keys(SYSTEM_FIELD_LABELS) as (keyof SystemFieldConfig)[]).map(
          (field) => (
            <div
              key={field}
              className="flex items-center justify-between gap-element"
            >
              <span className="text-foreground text-label">
                {SYSTEM_FIELD_LABELS[field]}
              </span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={config[field]}
                onValueChange={(v) => handleChange(field, v)}
              >
                {VISIBILITY_OPTIONS.filter((opt) =>
                  SYSTEM_FIELD_ALLOWED_VISIBILITIES[field].includes(opt.value),
                ).map((opt) => (
                  <ToggleGroupItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
