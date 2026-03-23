"use client"

import { Button } from "@/components/common/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { CustomFieldDisplay } from "@/components/submissions/custom-field-display"
import type {
  CustomForm,
  SystemFieldConfig,
  SystemFieldVisibility,
} from "@/lib/types"

function fieldLabel(label: string, visibility: SystemFieldVisibility) {
  if (visibility === "optional") return `${label} (optional)`
  return label
}

interface Props {
  systemFieldConfig: SystemFieldConfig
  customFields: CustomForm[]
}

export function SubmissionFormPreview({
  systemFieldConfig,
  customFields,
}: Props) {
  return (
    <div className="flex flex-col gap-group rounded-lg border p-4">
      <h3 className="font-serif text-heading">Preview</h3>
      <FieldGroup>
        <Field>
          <FieldLabel>
            First name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input type="text" disabled placeholder="First name" />
        </Field>
        <Field>
          <FieldLabel>
            Last name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input type="text" disabled placeholder="Last name" />
        </Field>
        <Field>
          <FieldLabel>
            Email <span className="text-destructive">*</span>
          </FieldLabel>
          <Input type="email" disabled placeholder="Email" />
        </Field>

        {systemFieldConfig.phone !== "hidden" && (
          <Field>
            <FieldLabel>
              {fieldLabel("Phone", systemFieldConfig.phone)}
              {systemFieldConfig.phone === "required" && (
                <span className="text-destructive"> *</span>
              )}
            </FieldLabel>
            <Input type="tel" disabled placeholder="Phone" />
          </Field>
        )}

        {systemFieldConfig.location !== "hidden" && (
          <Field>
            <FieldLabel>
              {fieldLabel("Location", systemFieldConfig.location)}
              {systemFieldConfig.location === "required" && (
                <span className="text-destructive"> *</span>
              )}
            </FieldLabel>
            <Input type="text" disabled placeholder="e.g. Toronto, ON" />
          </Field>
        )}

        {customFields.map((field) => (
          <CustomFieldDisplay
            key={field.id}
            field={field}
            value={field.type === "TOGGLE" ? "false" : ""}
            disabled
          />
        ))}

        {systemFieldConfig.headshots !== "hidden" && (
          <Field>
            <FieldLabel>
              {fieldLabel("Headshots", systemFieldConfig.headshots)}
              {systemFieldConfig.headshots === "required" && (
                <span className="text-destructive"> *</span>
              )}
            </FieldLabel>
            <FieldDescription>Upload headshot photos</FieldDescription>
            <div className="h-16 rounded-md border border-dashed" />
          </Field>
        )}

        {systemFieldConfig.resume !== "hidden" && (
          <Field>
            <FieldLabel>
              {fieldLabel("Resume", systemFieldConfig.resume)}
              {systemFieldConfig.resume === "required" && (
                <span className="text-destructive"> *</span>
              )}
            </FieldLabel>
            <div className="h-10 rounded-md border border-dashed" />
          </Field>
        )}

        {systemFieldConfig.links !== "hidden" && (
          <Field>
            <FieldLabel>
              {fieldLabel("Links", systemFieldConfig.links)}
              {systemFieldConfig.links === "required" && (
                <span className="text-destructive"> *</span>
              )}
            </FieldLabel>
            <FieldDescription>
              Add links to your portfolio, social media, or demo reels.
            </FieldDescription>
            <Input type="url" disabled placeholder="https://" />
          </Field>
        )}

        <Button type="button" disabled className="w-fit">
          Submit
        </Button>
      </FieldGroup>
    </div>
  )
}
