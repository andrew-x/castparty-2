# Custom Email from Submission Activity Log

## Context

Casting directors need to send ad-hoc emails to candidates directly from the
submission detail view. The existing infrastructure supports template-based emails
(submission received, rejected, selected) but there's no way to compose a freeform
email. This feature adds a compose form to the activity log's right pane, sends the
email, records it in the DB, and surfaces it in the activity timeline — all of which
already works for template emails.

## What Already Exists

- `sendSubmissionEmail()` internal function — sends email via Resend, records to `Email` table
- `sendSubmissionEmailAction` — secure action for template-based emails (requires `templateType`)
- `Email` table — stores all sent emails with subject, body, sender, recipient, templateType (nullable text)
- `EmailItem` component — renders emails in the activity log with expand/collapse
- `buildActivityList()` — merges emails into the unified activity timeline
- `FeedbackPanel` — right pane with accordion forms for comments and feedback

## Changes

### Step 1: New action for custom emails

**File:** `src/actions/submissions/send-custom-email.ts` (new)

Create a new secure action `sendCustomEmailAction`:
- Schema: `{ submissionId: z.string().min(1), subject: z.string().trim().min(1, "Subject is required.").max(200), body: z.string().trim().min(1, "Email body is required.").max(5000) }`
- Validates org ownership (same pattern as `sendSubmissionEmailAction` lines 125-138)
- Calls `sendSubmissionEmail(submissionId, null, subject, body, user.id)`

**File:** `src/actions/submissions/send-submission-email.tsx` (modify)

Widen `sendSubmissionEmail`'s `templateType` parameter from `TemplateType` to `string | null`.
This is safe because when `customSubject`/`customBody` are provided, `templateType` is only
used for the DB record (line 92), not for template interpolation.

### Step 2: Email compose form in FeedbackPanel

**File:** `src/components/productions/feedback-panel.tsx` (modify)

Add a third accordion item "Send email" after the existing "Add comment" and "Add feedback":
- Trigger: `MailIcon` + "Send email"
- Recipient context: show "To: {submission.email}" as muted text above the form
- Subject: `Input` with placeholder "Subject"
- Body: `Textarea` with placeholder "Write your email..." rows={4}
- Submit button: "Send email" with loading state
- Uses `useHookFormAction` with `sendCustomEmailAction` (same pattern as comment/feedback forms)
- On success: reset form, close accordion, `router.refresh()` to show email in activity log
- On error: display server error inline

### Step 3: Schema file

**File:** `src/lib/schemas/custom-email.ts` (new)

Zod schema for the custom email form, exported for use by both the action and the form resolver.
Matches the validation limits from existing email template schemas (200 char subject, 5000 char body).

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/actions/submissions/send-submission-email.tsx` | Widen `templateType` to `string \| null` |
| `src/lib/schemas/custom-email.ts` | **New** — Zod schema for custom email |
| `src/actions/submissions/send-custom-email.ts` | **New** — secure action for custom emails |
| `src/components/productions/feedback-panel.tsx` | Add email compose accordion |

## Agents

- **Main agent** executes all steps sequentially (4 files, small focused changes)
- **Code reviewer agent** after implementation to verify conventions and catch issues

## Verification

1. Open a submission detail sheet
2. The "Send email" accordion should appear below "Add feedback"
3. Fill in subject + body, click "Send email"
4. Email should appear in the activity log immediately after refresh
5. In dev mode, check `/admin/emails` to confirm the email was stored
6. Verify error states: empty subject, empty body, server error display
7. Run `bun run lint` to check for Biome issues
8. Run `bun run build` to verify no type errors
