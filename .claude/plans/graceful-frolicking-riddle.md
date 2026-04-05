# Plan: Bulk Send Email

## Context

Add a "Send email" bulk action to the submissions board. When multi-selecting
submissions, users can compose a freeform email with template tokens
({{first_name}}, {{last_name}}, etc.) and send one personalized email per
selected submission.

Spec: `docs/superpowers/specs/2026-04-05-bulk-send-email-design.md`

## Steps

### Step 1: Create schema (`src/lib/schemas/bulk-email.ts`)
- `bulkEmailFormSchema`: subject (trimmed, 1-200), body (trimmed, 1-5000)
- `bulkEmailActionSchema`: extends form schema with `submissionIds` (string[], 1-100)

### Step 2: Add `sendBatchEmail` to `src/lib/email.ts`
- New function alongside existing `sendEmail`
- Accepts array of `SendEmailOptions`
- Renders each React element to HTML
- Dev mode: adds each to dev email store
- Prod mode: calls `resend.batch.send()` in one API call
- Returns array of `{ html: string }`

### Step 3: Create server action (`src/actions/submissions/bulk-send-email.ts`)
- `bulkSendEmailAction` using `secureActionClient`
- Input: `bulkEmailActionSchema`
- Validate user's org owns all submissions
- Build per-submission variable maps, interpolate subject/body for each
- Call `sendBatchEmail` with all emails (one API call)
- Batch-insert Email records
- Return `{ sent: number }`
- Reuses: `interpolateTemplate`, `sendBatchEmail`, `TemplateEmail`, `generateId`

### Step 4: Add "Send email" button to BulkActionBar (`src/components/productions/bulk-action-bar.tsx`)
- Add `onSendEmail` prop to `Props` interface
- Add `MailIcon` button between "Move to" popover and "Compare" button
- Calls `onSendEmail()` on click

### Step 5: Create BulkEmailDialog component (`src/components/productions/bulk-email-dialog.tsx`)
- Dialog with subject input + body textarea, each with `VariableInsertButtons`
- Uses `useHookFormAction` with `bulkSendEmailAction` and `formResolver(bulkEmailFormSchema)`
- On submit: executes with `{ submissionIds, subject, body }`
- Success: calls `onSuccess`, shows toast with sent/failed count
- Partial failure: shows toast with counts
- Full failure: sets root form error
- Uses refs for cursor-position-aware token insertion

### Step 6: Wire everything in ProductionSubmissions (`src/components/productions/production-submissions.tsx`)
- Add `bulkEmailOpen` state
- Pass `onSendEmail={() => setBulkEmailOpen(true)}` to BulkActionBar
- Render BulkEmailDialog with `submissionIds={Array.from(selectedIds)}`, `onSuccess` clears selection + refreshes
- Pass `onOpenChange` for dialog close

## Verification
- Select submissions, click "Send email", compose with tokens, send
- Check dev email viewer for personalized emails
- Verify activity logs updated per submission
- Test empty field validation
- Test with different roles for varied token interpolation

## Agents
- **Steps 1-3**: Main agent (schema + email utility + server action, sequential)
- **Steps 4-5**: Main agent (UI components, sequential)
- **Step 6**: Main agent (wiring, depends on Steps 4-5)
- **Post-implementation**: Code reviewer agent for final review
