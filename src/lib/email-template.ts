import type { EmailTemplates } from "@/lib/types"

export const TEMPLATE_VARIABLES = [
  "first_name",
  "last_name",
  "production_name",
  "role_name",
  "organization_name",
] as const

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number]

export const TEMPLATE_VARIABLE_LABELS: Record<TemplateVariable, string> = {
  first_name: "First name",
  last_name: "Last name",
  production_name: "Production",
  role_name: "Role",
  organization_name: "Organization",
}

export function interpolateTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in variables ? variables[key] : match
  })
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplates = {
  submissionReceived: {
    subject: "Your submission for {{role_name}} has been received",
    body: "Hi {{first_name}},\n\nThank you for submitting for {{role_name}} in {{production_name}}. We've received your submission and will be in touch.\n\nBreak a leg!\n\n{{organization_name}}",
  },
  rejected: {
    subject: "Update on your submission for {{role_name}}",
    body: "Hi {{first_name}},\n\nThank you for your interest in {{role_name}} in {{production_name}}. After careful consideration, we've decided to go in a different direction for this role.\n\nWe appreciate you taking the time to audition and wish you the best in your future endeavors.\n\n{{organization_name}}",
  },
  selected: {
    subject: "Congratulations! You've been selected for {{role_name}}",
    body: "Hi {{first_name}},\n\nWe're excited to let you know that you've been selected for {{role_name}} in {{production_name}}!\n\nWe'll be in touch soon with next steps. Congratulations!\n\n{{organization_name}}",
  },
}
