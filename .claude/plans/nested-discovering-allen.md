# Email Templates Implementation Plan

**Spec:** `docs/superpowers/specs/2026-03-23-email-templates-design.md`

## Context

Castparty has no performer-facing emails. This plan adds customizable email templates for submission received, rejected, and selected events — with a settings page for editing, variable interpolation, and email sending at the right trigger points.

## Implementation Steps

### Step 1: Types, constants, and interpolation utility

**Files:**
- `src/lib/types.ts` — add `EmailTemplate` and `EmailTemplates` interfaces
- `src/lib/email-template.ts` — new file with `TEMPLATE_VARIABLES`, `DEFAULT_EMAIL_TEMPLATES`, `interpolateTemplate()`

**Agent:** Sonnet subagent (simple, isolated utility code)

### Step 2: Schema + migration

**Files:**
- `src/lib/db/schema.ts` — add `emailTemplates` JSONB column to `Production` table, import `DEFAULT_EMAIL_TEMPLATES` from `email-template.ts`
- Generate Drizzle migration: `bun drizzle-kit generate`

**Agent:** Sonnet subagent

### Step 3: Zod schema + server action for saving templates

**Files:**
- `src/lib/schemas/email-template.ts` — new Zod schemas (`emailTemplateSchema`, `emailTemplatesSchema`, `updateEmailTemplatesActionSchema`). Use `.trim()` before `.min(1)` on subject/body.
- `src/actions/productions/update-email-templates.ts` — `secureActionClient` action to update production's `emailTemplates`
- `src/actions/productions/create-production.ts` — add `emailTemplates: DEFAULT_EMAIL_TEMPLATES` to the production insert

**Agent:** Sonnet subagent

### Step 4: Email rendering + sending utility

**Files:**
- `src/lib/emails/template-email.tsx` — React Email component using `EmailLayout`, splits body on `\n\n` for paragraphs
- `src/actions/submissions/send-submission-email.ts` — two exports:
  - `sendSubmissionEmail(submissionId, templateType)` — plain async function (loads submission + role + production, interpolates, sends). Falls back to `DEFAULT_EMAIL_TEMPLATES` if `emailTemplates` is null.
  - `sendSubmissionEmailAction` — `secureActionClient` wrapper for client use

**Agent:** Sonnet subagent

### Step 5: Settings page UI (accordion form + variable buttons)

**Files:**
- `src/components/productions/variable-insert-buttons.tsx` — reusable row of small buttons, inserts `{{var}}` at cursor (or appends if unfocused)
- `src/components/productions/email-templates-form.tsx` — accordion form with 3 sections (submission received open by default), descriptions, subject inputs, body textareas, variable buttons below each field, single "Save changes" button. Uses `useHookFormAction` + `updateEmailTemplates` action.
- `src/app/(app)/productions/[id]/(production)/settings/emails/page.tsx` — server component, loads production via `getProduction(id)`, renders `EmailTemplatesForm`
- `src/components/productions/production-sub-nav.tsx` — add "Emails" nav item with `MailIcon`

**Agent:** UI/UX engineer subagent (accordion layout, variable insertion UX)

### Step 6: Wire up submission-received auto-send

**Files:**
- `src/actions/submissions/create-submission.ts` — add `emailTemplates` to production columns in the role query. After file handling, call `sendSubmissionEmail(submissionId, "submissionReceived")` in a try/catch (fire-and-forget, log errors).

**Agent:** Sonnet subagent

### Step 7: Enhanced rejection dialog with email preview

**Files:**
- `src/components/productions/reject-reason-dialog.tsx` — add email preview section below radio group. New props: `emailTemplate`, `submissionData`. Change `onConfirm` to `(reason: string, sendEmail: boolean) => void`. Add "Reject & send email" / "Reject without email" footer buttons.
- `src/components/productions/submission-detail-sheet.tsx` — update `handleRejectConfirm` to accept `sendEmail` boolean; call `sendSubmissionEmailAction` when true; pass email template + submission data to `RejectReasonDialog`; show error toast on email failure.

**Agent:** UI/UX engineer subagent (dialog redesign)

### Step 8: Selection email preview dialog

**Files:**
- `src/components/productions/email-preview-dialog.tsx` — new dialog showing interpolated email preview with "Select & send email" / "Select without email" / "Cancel"
- `src/components/productions/submission-detail-sheet.tsx` — intercept SELECTED stage changes (mirror rejection pattern), show `EmailPreviewDialog`, handle email sending with error toast

**Agent:** UI/UX engineer subagent

### Step 9: Code review

**Agent:** Code reviewer subagent — review all changes against spec, conventions, and architecture rules

### Step 10: Librarian update

**Agent:** Librarian subagent — update docs (FEATURES.md, ARCHITECTURE.md as needed)

## Verification

1. `bun run build` — ensure no type errors
2. `bun run lint` — ensure Biome passes
3. Manual testing:
   - Create a new production → verify `emailTemplates` defaults
   - Visit `/productions/[id]/settings/emails` → accordion with 3 sections
   - Edit templates, use variable buttons, save → verify persistence
   - Submit for a role → check `/admin/emails` for submission received email
   - Reject → combined dialog with email preview, both button paths work
   - Select → email preview dialog, both button paths work
   - Error case → email failure shows toast, doesn't break status changes

## Execution Strategy

Steps 1-4 are backend/utility work (sequential, each builds on the previous).
Steps 5-6 can run in parallel after steps 1-4 are complete.
Steps 7-8 can run in parallel after step 5 (they share the dialog pattern but are independent dialogs).
Step 9 runs after all implementation is complete.
Step 10 runs after review.
