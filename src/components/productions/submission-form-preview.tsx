import { Button } from "@/components/common/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { Label } from "@/components/common/label"
import { Separator } from "@/components/common/separator"
import { Switch } from "@/components/common/switch"
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
  const hasAdditionalInfo =
    systemFieldConfig.unionStatus !== "hidden" ||
    systemFieldConfig.representation !== "hidden"

  const hasMaterials =
    systemFieldConfig.headshots !== "hidden" ||
    systemFieldConfig.resume !== "hidden" ||
    systemFieldConfig.video !== "hidden" ||
    systemFieldConfig.links !== "hidden"

  const hasCustomFields = customFields.length > 0

  return (
    <div className="rounded-lg border bg-background p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="font-serif text-heading">Submit your audition</h3>
        <p className="mt-1 text-caption text-muted-foreground">
          Preview of how candidates will see the form.
        </p>
      </div>

      <FieldGroup>
        {/* Section: Contact info */}
        <div className="flex flex-col gap-block">
          <h4 className="border-brand/40 border-l-2 pl-2 font-semibold text-caption text-muted-foreground uppercase tracking-wide">
            Contact info
          </h4>
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
          </FieldGroup>
        </div>

        {/* Section: Additional info */}
        {hasAdditionalInfo && (
          <>
            <Separator />
            <div className="flex flex-col gap-block">
              <h4 className="border-brand/40 border-l-2 pl-2 font-semibold text-caption text-muted-foreground uppercase tracking-wide">
                Additional info
              </h4>
              <FieldGroup>
                {systemFieldConfig.unionStatus !== "hidden" && (
                  <Field>
                    <FieldLabel>
                      {fieldLabel(
                        "Union affiliations",
                        systemFieldConfig.unionStatus,
                      )}
                    </FieldLabel>
                    <FieldDescription>
                      Select your union memberships or type to add unlisted
                      unions.
                    </FieldDescription>
                    <Input
                      type="text"
                      disabled
                      placeholder="e.g. AEA, SAG-AFTRA"
                    />
                  </Field>
                )}

                {systemFieldConfig.representation !== "hidden" && (
                  <Field>
                    <FieldLabel>
                      {fieldLabel(
                        "Representation",
                        systemFieldConfig.representation,
                      )}
                    </FieldLabel>
                    <Label className="flex items-center gap-2">
                      <Switch disabled />
                      <span className="text-label text-muted-foreground">
                        I have an agent or manager
                      </span>
                    </Label>
                  </Field>
                )}
              </FieldGroup>
            </div>
          </>
        )}

        {/* Section: Materials */}
        {hasMaterials && (
          <>
            <Separator />
            <div className="flex flex-col gap-block">
              <h4 className="border-brand/40 border-l-2 pl-2 font-semibold text-caption text-muted-foreground uppercase tracking-wide">
                Materials
              </h4>
              <FieldGroup>
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

                {systemFieldConfig.video !== "hidden" && (
                  <Field>
                    <FieldLabel>
                      {fieldLabel("Video", systemFieldConfig.video)}
                      {systemFieldConfig.video === "required" && (
                        <span className="text-destructive"> *</span>
                      )}
                    </FieldLabel>
                    <FieldDescription>
                      Link a video from YouTube, Vimeo, Google Drive, or
                      Dropbox. You can also paste any direct video link.
                    </FieldDescription>
                    <Input type="url" disabled placeholder="https://" />
                  </Field>
                )}

                {systemFieldConfig.links !== "hidden" && (
                  <Field>
                    <FieldLabel>
                      {fieldLabel("Links", systemFieldConfig.links)}
                    </FieldLabel>
                    <FieldDescription>
                      Add links to your portfolio, social media, or demo reels.
                    </FieldDescription>
                    <Input type="url" disabled placeholder="https://" />
                  </Field>
                )}
              </FieldGroup>
            </div>
          </>
        )}

        {/* Section: Custom fields */}
        {hasCustomFields && (
          <>
            <Separator />
            <div className="flex flex-col gap-block">
              <h4 className="border-brand/40 border-l-2 pl-2 font-semibold text-caption text-muted-foreground uppercase tracking-wide">
                Additional questions
              </h4>
              <FieldGroup>
                {customFields.map((field) => {
                  if (field.type === "IMAGE") {
                    return (
                      <Field key={field.id}>
                        <FieldLabel>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive"> *</span>
                          )}
                        </FieldLabel>
                        {field.description && (
                          <FieldDescription>
                            {field.description}
                          </FieldDescription>
                        )}
                        <div className="h-16 rounded-md border border-dashed" />
                        <p className="text-caption text-muted-foreground">
                          Up to {field.maxFiles ?? 5} images
                        </p>
                      </Field>
                    )
                  }
                  if (field.type === "DOCUMENT") {
                    return (
                      <Field key={field.id}>
                        <FieldLabel>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive"> *</span>
                          )}
                        </FieldLabel>
                        {field.description && (
                          <FieldDescription>
                            {field.description}
                          </FieldDescription>
                        )}
                        <div className="h-10 rounded-md border border-dashed" />
                      </Field>
                    )
                  }
                  return (
                    <CustomFieldDisplay
                      key={field.id}
                      field={field}
                      value={field.type === "TOGGLE" ? "false" : ""}
                      disabled
                    />
                  )
                })}
              </FieldGroup>
            </div>
          </>
        )}

        <Button type="button" disabled className="w-full">
          Submit
        </Button>
      </FieldGroup>
    </div>
  )
}
