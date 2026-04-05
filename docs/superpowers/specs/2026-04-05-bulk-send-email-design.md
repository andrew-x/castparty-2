# Bulk Send Email

## Context

The submissions board supports multi-select with bulk actions (Move to, Compare).
Casting directors need to send ad-hoc emails to multiple candidates at once — e.g.,
rehearsal logistics, callback scheduling, or general announcements. Currently, emails
can only be sent as part of status-change workflows (reject/select) or one at a time
from the submission detail sheet.

This feature adds a "Send email" bulk action that opens a compose dialog with template
token support, sends one personalized email per selected submission, and records each
email in the activity log.

## Design

### Bulk Action Bar

Add a "Send email" button to `BulkActionBar` between "Move to" and "Compare". Uses a
`MailIcon` left section. Clicking opens the `BulkEmailDialog`.

New prop: `onSendEmail: () => void`.

**File:** `src/components/productions/bulk-action-bar.tsx`

### BulkEmailDialog Component

New dialog component for composing and sending bulk emails.

**File:** `src/components/productions/bulk-email-dialog.tsx`

**UI layout:**
- Dialog title: "Send email"
- Dialog description: "Sending to N candidates" (count of selected submissions)
- Subject field (Input) with `VariableInsertButtons` below
- Body field (Textarea, 8 rows) with `VariableInsertButtons` below
- Footer: Cancel button, Send button with loading state

**Form:**
- Uses `useHookFormAction` with the `bulkSendEmailAction`
- Subject: trimmed, 1–200 chars (matches existing `emailTemplateSchema` constraints)
- Body: trimmed, 1–5000 chars
- On submit: executes action with `{ submissionIds, subject, body }`

**Post-send behavior:**
- Success: close dialog, clear selection, show toast "Emails sent to N candidates"
- Partial failure: close dialog, clear selection, toast "Sent N emails. M failed to send."
- Full failure: show root form error, keep dialog open

**Props:**
```typescript
interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  submissionIds: string[]
  onSuccess: () => void  // clears selection
}
```

**Token insertion:** Each field (subject and body) gets its own `VariableInsertButtons`
instance. Uses the same `TEMPLATE_VARIABLES` and insertion logic as the email templates
form. Requires refs on Input and Textarea for cursor-position-aware insertion.

### Schema

New file: `src/lib/schemas/bulk-email.ts`

```typescript
export const bulkEmailFormSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  body: z.string().trim().min(1, "Body is required.").max(5000),
})

export const bulkEmailActionSchema = bulkEmailFormSchema.extend({
  submissionIds: z.array(z.string().min(1)).min(1).max(100),
})
```

### Batch Email Utility (`src/lib/email.ts`)

Add a `sendBatchEmail` function alongside the existing `sendEmail`:

- Accepts an array of `SendEmailOptions` (same shape as single send)
- Renders each React element to HTML via `@react-email/components`
- In dev: adds each to the dev email store
- In prod: calls `resend.batch.send()` with all emails in one API call
- Returns array of `{ html: string }` results

Resend's batch API supports up to 100 emails per call, which matches the
`MAX_BULK_SELECTION` limit exactly.

### Server Action: bulkSendEmailAction

New file: `src/actions/submissions/bulk-send-email.ts`

**Input:** `{ submissionIds: string[], subject: string, body: string }`

**Logic:**
1. Validate authenticated user has an active organization
2. Fetch all submissions with candidate, role, production, and organization data
3. Verify all submissions belong to the user's organization
4. For each submission: build variable map, interpolate subject and body
5. Send all emails in one `sendBatchEmail` call
6. Batch-insert all `Email` records with `templateType: null`, `direction: "outbound"`
7. Return `{ sent: number }`

**Reuses:**
- `interpolateTemplate` from `@/lib/email-template`
- `sendBatchEmail` from `@/lib/email` (new)
- `TemplateEmail` from `@/lib/emails/template-email`
- `secureActionClient` from `@/lib/action`

### Data Flow

```
BulkActionBar → "Send email" click
  → ProductionSubmissions opens BulkEmailDialog (passes selectedIds as string[])
  → User composes subject + body with {{tokens}}
  → Clicks "Send"
  → useHookFormAction executes bulkSendEmailAction
  → Server: validate ownership, interpolate templates per submission
    → sendBatchEmail (one Resend API call for all emails)
    → Batch-insert Email records
  → Returns { sent }
  → Client: toast result, close dialog, clear selection, router.refresh()
```

### Wiring in ProductionSubmissions

`ProductionSubmissions` manages the dialog open state and passes `selectedIds` as an
array. On success callback: clears `selectedIds`, calls `router.refresh()` to sync
activity logs.

**File:** `src/components/productions/production-submissions.tsx`

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/productions/bulk-email-dialog.tsx` | Compose dialog |
| `src/actions/submissions/bulk-send-email.ts` | Server action |
| `src/lib/schemas/bulk-email.ts` | Zod schemas |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/email.ts` | Add `sendBatchEmail` function using `resend.batch.send()` |
| `src/components/productions/bulk-action-bar.tsx` | Add "Send email" button + `onSendEmail` prop |
| `src/components/productions/production-submissions.tsx` | Wire dialog state, pass props |

## Verification

1. Select 2+ submissions on the board
2. Click "Send email" in the bulk action bar
3. Verify dialog opens with recipient count
4. Type a subject and body using template token buttons
5. Click Send
6. Verify emails appear in each submission's activity log (detail sheet → emails section)
7. Verify toast shows correct count
8. Verify selection is cleared after send
9. In dev mode: check emails in the dev email viewer
10. Test validation: try sending with empty subject or body
11. Test with submissions from different roles to verify per-submission token interpolation
