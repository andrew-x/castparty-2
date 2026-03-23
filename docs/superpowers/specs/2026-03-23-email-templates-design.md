# Email Templates for Submissions

## Context

Castparty currently has no performer-facing email notifications. When a performer submits for a role, gets rejected, or gets selected, there is no communication back to them. This feature adds customizable email templates that casting directors can edit per production, with automatic sending on submission and confirmed sending on rejection/selection.

## Requirements

- 3 email templates per production: **submission received**, **rejected**, **selected**
- Each template has a customizable **subject line** and **body** (plain text)
- 4 template variables: `{{first_name}}`, `{{last_name}}`, `{{production_name}}`, `{{role_name}}`
- Variable insertion buttons below each input field (subject and body each get their own set)
- Reasonable defaults set automatically on production creation
- Settings page under the production settings area
- **Submission received**: always auto-sends when a performer submits
- **Rejected/Selected**: casting director sees a preview of the interpolated email and confirms before sending

## Data Model

**New JSONB column** on the `Production` table (follows existing pattern for `submissionFormFields`, `systemFieldConfig`, etc.):

```ts
emailTemplates: jsonb().$type<EmailTemplates>().notNull().default(DEFAULT_EMAIL_TEMPLATES)
```

**Types (in `src/lib/types.ts`):**

```ts
interface EmailTemplate {
  subject: string
  body: string
}

interface EmailTemplates {
  submissionReceived: EmailTemplate
  rejected: EmailTemplate
  selected: EmailTemplate
}
```

**Default templates:**

| Template | Subject | Body |
|----------|---------|------|
| Submission Received | `Your submission for {{role_name}} has been received` | `Hi {{first_name}},\n\nThank you for submitting for {{role_name}} in {{production_name}}. We've received your submission and will be in touch.\n\nBreak a leg!` |
| Rejected | `Update on your submission for {{role_name}}` | `Hi {{first_name}},\n\nThank you for your interest in {{role_name}} in {{production_name}}. After careful consideration, we've decided to go in a different direction for this role.\n\nWe appreciate you taking the time to audition and wish you the best in your future endeavors.` |
| Selected | `Congratulations! You've been selected for {{role_name}}` | `Hi {{first_name}},\n\nWe're excited to let you know that you've been selected for {{role_name}} in {{production_name}}!\n\nWe'll be in touch soon with next steps. Congratulations!` |

## Settings Page UI

**Route:** `/productions/[id]/settings/emails`

**Nav item:** "Emails" with `MailIcon` in `ProductionSubNav`

**Layout:** Accordion with 3 collapsible sections. "Submission Received" open by default. Each section has:

1. **Description** — short text explaining what the template is for and when it triggers (visible even when collapsed as subtitle)
2. **Subject input** — text input with the template subject
3. **Variable buttons** — row of small buttons below the subject input (`first_name`, `last_name`, `production_name`, `role_name`). Clicking inserts `{{variable_name}}` at the cursor position. If the field has no focus, append to the end.
4. **Body textarea** — plain text textarea with the template body
5. **Variable buttons** — same row of buttons below the body textarea

**Template descriptions:**

- **Submission Received:** "Sent automatically when a performer submits for a role in this production."
- **Rejected:** "Sent when you reject a submission. You'll see a preview before it sends."
- **Selected:** "Sent when you select a performer for a role. You'll see a preview before it sends."

**Form:** Single form wrapping all 3 templates with one "Save changes" button. Uses `useHookFormAction` + Zod validation. Zod schema must include `.trim()` on both `subject` and `body` fields before `.min(1)`.

## Email Sending

### Submission Received (auto-send)

At the end of `create-submission.ts`, after the submission and files are created:
1. Load the production's `emailTemplates` (already available from the role query at the top of the action — add `emailTemplates` to the production columns)
2. Interpolate the `submissionReceived` template with the submission data
3. Call `sendSubmissionEmail()` (plain utility function — see below) wrapped in `try/catch` with `logger.error` fallback, matching the pattern used for PDF parsing (lines 265-279). This ensures email failure never breaks the submission.

**Variable resolution:** `first_name` and `last_name` come from the `Submission` table's fields (the values at submission time), not from `Candidate`. `production_name` comes from the production. `role_name` comes from the role.

### Rejected (preview & confirm)

The existing `RejectReasonDialog` is enhanced to include an email preview section:
1. **Top section:** Rejection reason selection (existing radio group — unchanged)
2. **Bottom section:** Read-only preview of the interpolated rejection email (subject + body)
3. **Footer buttons:** "Reject & send email" / "Reject without email" / "Cancel"

**Props change:** The dialog receives additional props: `emailTemplate` (the rejection `EmailTemplate`) and `submissionData` (the variables for interpolation). The `onConfirm` callback signature changes from `(reason: string) => void` to `(reason: string, sendEmail: boolean) => void` so the parent knows whether to send the email.

**Interpolation** happens client-side for the preview display. The actual email send happens server-side via a `sendSubmissionEmail` server action after the status update succeeds.

### Selected (preview & confirm)

New `EmailPreviewDialog` component shown when moving a submission to a `SELECTED` stage:
1. Read-only preview of the interpolated selection email (subject + body)
2. **Footer buttons:** "Select & send email" / "Select without email" / "Cancel"

**Interception:** The SELECTED interception mirrors the rejection pattern entirely in `submission-detail-sheet.tsx`. `StageControls` passes only `stageId` (unchanged). The sheet checks if the target stage type is `SELECTED` and opens the `EmailPreviewDialog` before proceeding. The `stage-controls.tsx` file does NOT need changes.

### Error handling for rejected/selected emails

If the `sendSubmissionEmail` server action fails after a successful status update, show an error toast to the casting director (e.g., "Status updated but email failed to send"). The status change is not rolled back — the email is a secondary action.

## Architecture: Utility vs Server Action

**`src/lib/email-template.ts`** — Pure utility (no "use server"):
- `interpolateTemplate(template, variables)` — string replacement
- `DEFAULT_EMAIL_TEMPLATES` constant
- `TEMPLATE_VARIABLES` list

**`src/actions/submissions/send-submission-email.ts`** — Two exports:
1. `sendSubmissionEmail(submissionId, templateType)` — plain async function (NOT a server action). Loads the submission with role + production joins, interpolates the template, calls `sendEmail`. Used directly by `create-submission.ts` for submission-received emails.
2. `sendSubmissionEmailAction` — `secureActionClient` wrapper around the same logic. Used by the client for rejected/selected emails after status update. Requires auth (casting director session).

**Fallback for existing productions:** If `production.emailTemplates` is null/undefined (pre-migration rows), fall back to `DEFAULT_EMAIL_TEMPLATES`.

## Email Rendering

New React Email component `src/lib/emails/template-email.tsx`:
- Wraps the interpolated plain text body in the existing `EmailLayout` component
- Splits text on `\n\n` for paragraphs, renders each as a `<Text>` element
- The `text` parameter for `sendEmail` is the raw interpolated string

## File Changes

### New files
| File | Purpose |
|------|---------|
| `src/lib/email-template.ts` | Interpolation utility, `DEFAULT_EMAIL_TEMPLATES`, `TEMPLATE_VARIABLES` |
| `src/lib/emails/template-email.tsx` | React Email component for user-defined templates |
| `src/lib/schemas/email-template.ts` | Zod schemas for email template validation (`.trim()` before `.min(1)` on subject/body) |
| `src/actions/productions/update-email-templates.ts` | Server action to save templates |
| `src/actions/submissions/send-submission-email.ts` | Plain utility function + server action wrapper for sending templated emails |
| `src/app/(app)/productions/[id]/(production)/settings/emails/page.tsx` | Settings page |
| `src/components/productions/email-templates-form.tsx` | Accordion form component |
| `src/components/productions/variable-insert-buttons.tsx` | Reusable variable button row |
| `src/components/productions/email-preview-dialog.tsx` | Preview dialog for selection |

### Modified files
| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `emailTemplates` JSONB column to `Production` (imports `DEFAULT_EMAIL_TEMPLATES` from `email-template.ts`) |
| `src/lib/types.ts` | Add `EmailTemplate`, `EmailTemplates` types |
| `src/actions/productions/create-production.ts` | Include `DEFAULT_EMAIL_TEMPLATES` in production insert |
| `src/actions/submissions/create-submission.ts` | Add `emailTemplates` to production columns in role query; send submission received email after creation (try/catch, fire-and-forget) |
| `src/components/productions/production-sub-nav.tsx` | Add "Emails" nav item with `MailIcon` |
| `src/components/productions/reject-reason-dialog.tsx` | Add email preview section, new props (`emailTemplate`, `submissionData`), change `onConfirm` to `(reason: string, sendEmail: boolean) => void` |
| `src/components/productions/submission-detail-sheet.tsx` | Intercept SELECTED stage changes (mirror rejection pattern), show email preview dialog, pass email templates and submission data to dialogs, handle `sendEmail` boolean from reject dialog |

### Migration
- Drizzle migration to add `emailTemplates` JSONB column with default value

## Verification

1. **Create a new production** — verify `emailTemplates` field is populated with defaults
2. **Visit `/productions/[id]/settings/emails`** — verify accordion renders with 3 sections, first open, descriptions visible
3. **Edit templates** — modify subject/body, click variable buttons to insert variables at cursor (and at end when unfocused), save
4. **Submit for a role** (public form) — verify submission received email is sent (check `/admin/emails` in dev)
5. **Reject a submission** — verify combined dialog shows rejection reason + email preview, "Reject & send email" sends, "Reject without email" rejects silently
6. **Select a submission** — verify email preview dialog appears, confirm sends email, skip rejects without email
7. **Error case** — temporarily break email sending, verify submission still succeeds and reject/select shows error toast
8. **Existing production** — verify an older production (without emailTemplates) falls back to defaults
