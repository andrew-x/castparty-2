import { Button } from "@/components/common/button"
import { Field, FieldGroup, FieldLabel } from "@/components/common/field"
import { Label } from "@/components/common/label"
import { RadioGroup, RadioGroupItem } from "@/components/common/radio-group"
import { Textarea } from "@/components/common/textarea"
import { CustomFieldDisplay } from "@/components/submissions/custom-field-display"
import type { CustomForm } from "@/lib/types"

const RATING_LABELS: Record<string, string> = {
  STRONG_YES: "4 - Strong yes",
  YES: "3 - Yes",
  NO: "2 - No",
  STRONG_NO: "1 - Strong no",
}

const RATING_OPTIONS = ["STRONG_YES", "YES", "NO", "STRONG_NO"]

interface Props {
  customFields: CustomForm[]
}

export function FeedbackFormPreview({ customFields }: Props) {
  return (
    <div className="flex flex-col gap-group rounded-lg border p-4">
      <h3 className="font-serif text-heading">Preview</h3>
      <FieldGroup>
        <Field>
          <FieldLabel>
            Rating <span className="text-destructive">*</span>
          </FieldLabel>
          <RadioGroup disabled className="flex flex-col gap-element">
            {RATING_OPTIONS.map((option) => (
              <Label
                key={option}
                className="flex items-center gap-element font-normal text-label"
              >
                <RadioGroupItem value={option} />
                {RATING_LABELS[option]}
              </Label>
            ))}
          </RadioGroup>
        </Field>

        <Field>
          <FieldLabel>Notes</FieldLabel>
          <Textarea disabled placeholder="Add your notes..." rows={3} />
        </Field>

        {customFields.map((field) => (
          <CustomFieldDisplay
            key={field.id}
            field={field}
            value={field.type === "TOGGLE" ? "false" : ""}
            disabled
          />
        ))}

        <Button type="button" disabled className="w-fit">
          Submit feedback
        </Button>
      </FieldGroup>
    </div>
  )
}
