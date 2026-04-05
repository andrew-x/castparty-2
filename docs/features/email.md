# Email System

> **Last verified:** 2026-04-05

## Overview

The email system handles all communication between Castparty and performers across the casting lifecycle. It comprises five subsystems:

1. **Email Templates** -- per-production customizable templates for Submission Received, Rejected, and Selected emails with variable interpolation.
2. **Email Storage** -- persistence of all outbound and inbound emails in a dedicated `Email` table, surfaced in the submission activity log.
3. **Inbound Email** -- performers reply to any Castparty email; replies route back via a Resend webhook, are linked to the correct submission, and appear in the activity feed.
4. **Bulk Email** -- casting directors select multiple submissions and send a freeform email to all of them in one action.
5. **Email Emulator** (dev-only) -- intercepts outbound emails in memory for preview in an admin inbox.

Exists because casting requires a two-way communication loop: performers need confirmation of their submission, notification of decisions, and the ability to reply -- while casting directors need an audit trail of everything sent and received.

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/productions/[id]/settings/emails` | `EmailTemplatesForm` | Org member (owner/admin) | Edit per-production email templates |
| `/api/webhooks/resend` | Route handler (POST) | Svix signature verification | Receives inbound email webhooks from Resend |
| `/admin/emails` | `AdminEmailsClient` | Dev-only (`IS_DEV`) | List all captured dev emails |
| `/admin/emails/[id]` | `AdminEmailDetailClient` | Dev-only (`IS_DEV`) | Preview a single captured email in sandboxed iframe |
| `/admin/simulate-email` | `SimulateEmailClient` | Dev-only (admin action) | Insert a synthetic inbound Email row for testing |

## Data Model

### Email table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | `generateId("eml")` prefix |
| `organizationId` | `text` NOT NULL | FK -> Organization (cascade delete) |
| `submissionId` | `text` NULL | FK -> Submission (cascade delete) |
| `sentByUserId` | `text` NULL | FK -> User (set null on delete) |
| `direction` | `text` NOT NULL | `"outbound"` or `"inbound"`, default `"outbound"` |
| `fromEmail` | `text` NULL | Sender address (populated for inbound only) |
| `toEmail` | `text` NOT NULL | |
| `subject` | `text` NOT NULL | |
| `bodyText` | `text` NOT NULL | |
| `bodyHtml` | `text` NOT NULL | |
| `templateType` | `text` NULL | `"submissionReceived"` / `"rejected"` / `"selected"` / null |
| `resendEmailId` | `text` NULL | Resend's email ID for deduplication (unique index) |
| `sentAt` | `timestamp` | default now() |

Indexes: `email_submissionId_idx`, `email_organizationId_idx`, `email_resendEmailId_idx` (unique).

### emailTemplates on Production

JSONB column typed as `EmailTemplates` (`src/lib/types.ts`):

```ts
interface EmailTemplates {
  submissionReceived: { subject: string; body: string }
  rejected:           { subject: string; body: string }
  selected:           { subject: string; body: string }
}
```

Defaults to `DEFAULT_EMAIL_TEMPLATES` on creation. Null values fall back to defaults at runtime.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/email.ts` | `sendEmail()` entry point; dev branch stores in memory; prod branch calls Resend |
| `src/lib/email-template.ts` | `interpolateTemplate()`, `DEFAULT_EMAIL_TEMPLATES`, `TEMPLATE_VARIABLES` |
| `src/lib/emails/template-email.tsx` | React Email component; wraps interpolated body in `EmailLayout` |
| `src/lib/email-dev-store.ts` | In-memory store: `addEmail`, `getEmails`, `getEmailById`; guards on `IS_DEV` |
| `src/lib/schemas/email-template.ts` | Zod schemas for template validation |
| `src/lib/schemas/custom-email.ts` | Zod schema for freeform custom emails |
| `src/actions/productions/update-email-templates.ts` | Save all three templates at once |
| `src/actions/submissions/send-submission-email.tsx` | `sendSubmissionEmail()` + `sendSubmissionEmailAction`; inserts outbound `Email` row |
| `src/actions/submissions/send-custom-email.ts` | Sends freeform email to a single submission (no template) |
| `src/actions/submissions/bulk-send-email.ts` | `bulkSendEmailAction`; sends freeform email to multiple submissions via `sendBatchEmail()` |
| `src/components/productions/bulk-email-dialog.tsx` | `BulkEmailDialog`; subject + body form with variable insert buttons; opened from Kanban bulk actions |
| `src/lib/schemas/bulk-email.ts` | Zod schemas for bulk email form and action |
| `src/actions/emails/receive-inbound-email.ts` | Deduplicates by `resendEmailId`, inserts inbound `Email` row |
| `src/app/api/webhooks/resend/route.ts` | Webhook handler: Svix verification, submission ID extraction from reply-to |
| `src/components/productions/email-templates-form.tsx` | Template list + editor with variable insert buttons |
| `src/components/productions/email-preview-dialog.tsx` | Editable preview dialog for reject/select emails |
| `src/components/productions/variable-insert-buttons.tsx` | Buttons that insert `{{variable}}` at cursor |

## How It Works

### Outbound: Template Emails

```
createSubmission action (auto-send "submissionReceived"):
  └── try { sendSubmissionEmail(submissionId, "submissionReceived") }
        ├── Fetch submission + role + production + org
        ├── Get templates from production.emailTemplates ?? DEFAULT_EMAIL_TEMPLATES
        ├── interpolateTemplate(template.subject, variables)
        ├── interpolateTemplate(template.body, variables)
        ├── Set replyTo = "reply+{submissionId}@{INBOUND_EMAIL_DOMAIN}"
        ├── sendEmail({ to, subject, react: <TemplateEmail />, text, replyTo })
        └── db.insert(Email) { direction: "outbound", ... }

Rejected/Selected (preview & confirm):
  SubmissionDetailSheet → EmailPreviewDialog
    ├── Editable subject/body (pre-interpolated client-side)
    ├── "{Action} & send email" → updateSubmissionStatus + sendSubmissionEmailAction
    └── "{Action} without email" → updateSubmissionStatus only
```

### Inbound: Performer Replies

```
Performer hits Reply → reply+{submissionId}@{INBOUND_EMAIL_DOMAIN}
  └── Resend receives → POST /api/webhooks/resend
        1. Svix signature verification
        2. Filter: payload.type === "email.received" only
        3. Extract submissionId from reply-to address
        4. receiveInboundEmail({...})
           ├── Deduplicate by resendEmailId (unique index)
           ├── Verify submission exists
           └── db.insert(Email) { direction: "inbound", fromEmail: sender }
        5. Return 200 OK (always, even on soft failures)
```

### Bulk Email

Casting directors can select multiple submissions in the Kanban and send a single composed email to all of them.

```
Kanban bulk-select → BulkEmailDialog
  ├── Subject + Body inputs with variable insert buttons
  ├── form.handleSubmit → bulkSendEmailAction({ submissionIds, subject, body })

bulkSendEmailAction:
  1. Auth + org ownership check (all submission IDs must belong to active org)
  2. Deduplicate submission IDs
  3. Build per-submission payloads (interpolate variables, set unique replyTo)
  4. sendBatchEmail(payloads) → Resend batch API
  5. db.insert(Email) one row per submission (outbound, templateType: null)
  6. revalidatePath
```

Variable interpolation uses the same `interpolateTemplate()` as template emails. Each email gets its own `replyTo` address (`reply+{submissionId}@{INBOUND_EMAIL_DOMAIN}`), so performer replies still route back to the correct submission.

If batch send succeeds but DB insert fails, the action throws a descriptive error noting emails were sent but not logged (prevents double-send on retry).

### Dev Emulator

```
sendEmail() [IS_DEV = true]
  └── render(react) → HTML → addEmail to globalThis.__devEmails (capped at 200)

GET /admin/emails → table of captured emails
GET /admin/emails/[id] → sandboxed iframe preview
```

## Business Logic

**Template variables:** `{{first_name}}`, `{{last_name}}`, `{{production_name}}`, `{{role_name}}`, `{{organization_name}}`. Unknown variables left as-is.

**Validation:** Subject max 200 chars, body max 5000 chars, both trimmed.

**Auto-send rules:** Submission Received is fire-and-forget (try/catch). Rejected/Selected require casting director confirmation via preview dialog.

**Reply-to addressing:** Every outbound email includes `replyTo: "reply+{submissionId}@{INBOUND_EMAIL_DOMAIN}"`. Sole mechanism for routing inbound replies.

**Deduplication:** Inbound emails deduplicated via unique index on `resendEmailId`.

**Soft failure handling:** Webhook returns 200 OK even on unroutable emails (prevents Resend retry loops).

**Email persistence:** Every outbound send inserts an Email row regardless of delivery success.

## UI States

| Surface | Loading | Empty | Error | Success |
|---------|---------|-------|-------|---------|
| Templates form | Button spinner | Defaults pre-populated | Root form error | `router.refresh()` |
| Preview dialog | N/A | N/A | N/A | Dialog closes |
| Dev email list | force-dynamic SSR | "No emails yet" | N/A | Table renders |
| Dev email detail | Iframe auto-resizes | `notFound()` | N/A | Rendered |
| Simulate inbound | Button spinner | N/A | Root form error | Success alert + reset |

## Integration Points

- [Kanban](./kanban.md) -- coordinates reject/select email flows, hosts activity log
- [Pipeline Stages](./pipeline.md) -- stage type detection triggers email preview dialogs
- [Reject Reasons](./reject-reasons.md) -- `RejectReasonDialog` includes email preview for rejection
- [Submissions](./submissions.md) -- auto-sends "submission received" email after new submission

**Environment variables:** `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `INBOUND_EMAIL_DOMAIN`, `EMAIL_FROM`.

## Architecture Decisions

- **Two exports from `send-submission-email.tsx`.** Plain function for server-side calls (no auth context); `secureActionClient` wrapper for client-triggered sends. Shares core logic.
- **Client-side interpolation for preview, server-side for send.** Preview dialog interpolates in the browser. Actual send re-fetches and re-interpolates on server.
- **`globalThis` for dev store.** Next.js HMR re-imports modules; `globalThis.__devEmails` persists across hot reloads.
- **Sandboxed iframe for HTML preview.** Blocks script execution while allowing email CTAs to be tested.
- **`direction` column, not separate tables.** Inbound and outbound emails share the `Email` table. Keeps activity log query simple.
- **Return 200 OK on webhook soft failures.** Prevents Resend from retrying indefinitely. (ADR-010: Svix for verification)
