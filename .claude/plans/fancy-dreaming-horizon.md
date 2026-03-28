# Inbound Email Support

## Context

Castparty sends emails to candidates (submission confirmations, rejections, selections, custom emails) but has no way to receive replies. Candidates who reply to these emails get a bounce or void. This feature closes the loop: outgoing emails get a unique reply-to address, Resend routes replies back via webhook, and the reply appears in the submission's activity log. An admin simulate page enables local testing without Resend infrastructure.

## Step 1: Schema — Add `direction` and `fromEmail` to Email table

**File:** `src/lib/db/schema.ts` (lines 503-527)

Add two columns to the `Email` pgTable:
- `direction: text().notNull().default("outbound")` — `"outbound"` or `"inbound"`
- `fromEmail: text()` — sender address for inbound emails (nullable)

Existing rows get `direction = "outbound"` automatically via the default. No data migration needed.

**Then run:** `bun run db:update` (generates + runs migration)

## Step 2: Add `replyTo` to outbound email flow

**File:** `src/lib/email.ts`
- Add `replyTo?: string` to `SendEmailOptions`
- Pass `replyTo` to `resend.emails.send()`

**File:** `src/lib/email-dev-store.ts`
- Add `replyTo?: string` to `StoredEmail` and `addEmail`

**File:** `src/actions/submissions/send-submission-email.tsx`
- Compute reply-to: `` `reply+${submissionId}@${process.env.INBOUND_EMAIL_DOMAIN ?? "inbound.joincastparty.com"}` ``
- Pass to `sendEmail({ ..., replyTo })`

Submission IDs are CUIDs (unguessable), so encoding them in the reply-to is safe.

## Step 3: Webhook endpoint for Resend inbound emails

**New file:** `src/app/api/webhooks/resend/route.ts`

**New dependency:** `svix` (for webhook signature verification)

`POST` handler:
1. Read raw body, extract Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`)
2. Verify signature using `new Webhook(RESEND_WEBHOOK_SECRET).verify(body, headers)`
3. Ignore non-`email.received` events (return 200)
4. Parse `to` addresses for `reply+{submissionId}@...` pattern
5. Look up submission to get `organizationId`
6. If the webhook payload includes `text`/`html` body, use them directly; otherwise fetch via Resend's received emails API using `email_id`
7. Insert `Email` record with `direction: "inbound"`, `fromEmail`, `sentByUserId: null`
8. Return 200

Edge cases:
- No matching reply-to pattern → log + return 200 (don't retry)
- Submission not found → log + return 200
- Missing webhook secret → return 500 (config error, Resend retries)

## Step 4: Update types and data fetching

**File:** `src/lib/submission-helpers.ts`
- Add `direction: string` and `fromEmail: string | null` to `EmailData` interface

**File:** `src/actions/productions/get-production-submissions.ts` (line 133)
- Add `direction: e.direction` and `fromEmail: e.fromEmail` to email mapping

**File:** `src/actions/candidates/get-candidate.ts` (line 104)
- Same addition to email mapping

## Step 5: Activity log UI — distinguish inbound vs outbound

**File:** `src/components/productions/feedback-panel.tsx` — `EmailItem` component (line 226)

- Inbound: show `"{email} replied"` with a left blue accent border and "Reply" badge
- Outbound: unchanged (`"{name} sent an email"`)

The existing "email" activity filter covers both directions with no change.

## Step 6: Admin simulate inbound email page

**New file:** `src/actions/admin/simulate-inbound-email.ts`
- `adminActionClient` server action (dev-only gated)
- Input: `submissionId`, `fromEmail`, `subject`, `bodyText`
- Looks up submission → inserts inbound Email record directly in DB

**New file:** `src/app/admin/simulate-email/page.tsx`
- Server component, renders the client form

**New file:** `src/components/admin/simulate-email-client.tsx`
- Client form: Submission ID, From Email, Subject, Body text fields
- Uses `useHookFormAction` with the simulate action
- Success toast + form reset

**File:** `src/app/admin/layout.tsx` (line 44)
- Add "Simulate Email" nav link alongside Users, Organizations, Emails

## Step 7: Environment config

**File:** `.env.example` — add:
```
RESEND_WEBHOOK_SECRET=
INBOUND_EMAIL_DOMAIN=inbound.joincastparty.com
```

## Files Modified

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `direction`, `fromEmail` columns to Email |
| `src/lib/email.ts` | Add `replyTo` param, pass to Resend |
| `src/lib/email-dev-store.ts` | Add `replyTo` to StoredEmail |
| `src/actions/submissions/send-submission-email.tsx` | Compute + pass reply-to address |
| `src/lib/submission-helpers.ts` | Extend `EmailData` type |
| `src/actions/productions/get-production-submissions.ts` | Map new fields |
| `src/actions/candidates/get-candidate.ts` | Map new fields |
| `src/components/productions/feedback-panel.tsx` | Update `EmailItem` for inbound |
| `src/app/admin/layout.tsx` | Add nav link |
| `.env.example` | Add new env vars |

## Files Created

| File | Purpose |
|------|---------|
| `src/app/api/webhooks/resend/route.ts` | Webhook handler |
| `src/actions/admin/simulate-inbound-email.ts` | Dev simulate action |
| `src/app/admin/simulate-email/page.tsx` | Simulate page |
| `src/components/admin/simulate-email-client.tsx` | Simulate form |

## Subagents

- **Explore agent** — used during planning (already complete)
- **Plan agent** — used during planning (already complete)
- **Code reviewer agent** — after implementation, review changes for convention compliance
- **Librarian agent** — after implementation, update `docs/FEATURES.md` with inbound email feature

## Verification

1. **Reply-to on outbound**: Send an email from a submission panel → check dev email store at `/admin/emails` for `replyTo` field
2. **Admin simulate**: Go to `/admin/simulate-email`, enter a submission ID + details, submit → navigate to that submission's activity log and confirm inbound email appears with blue accent and "Reply" badge
3. **Activity log filter**: Toggle the "Emails" filter → both inbound and outbound should appear
4. **Webhook**: `curl -X POST /api/webhooks/resend` with test payload → confirm email record created (or use Resend dashboard "Send test webhook")
5. **Build**: `bun run build` passes with no type errors
6. **Lint**: `bun run lint` passes
