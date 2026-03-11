# Plan: Development Email Emulator (Approved)

## Context

In development, `sendEmail()` currently renders React Email templates to HTML and logs them to console. This makes it hard to preview what emails actually look like. This feature replaces console logging with an in-memory store and an admin UI at `/admin/emails` where you can browse and preview emails as they'd appear in a real email client. Production behavior (Resend) is unchanged.

## Files to Create

### 1. `src/lib/email-dev-store.ts` — In-memory email store

Top-of-file comment explaining this is a development-only module for previewing emails without sending them. Module-level array stored on `globalThis` (survives HMR). Exposes:

- `StoredEmail` interface: `{ id, to, subject, html, text, sentAt }`
- `addEmail(email)` — prepends to array, auto-generates `id` (via `generateId`) and `sentAt`
- `getEmails()` — returns all stored emails (newest first)
- `getEmailById(id)` — finds single email
- Cap at 200 entries to prevent unbounded growth

Uses `generateId` from `@/lib/util` for IDs. **Every exported function guards with `IS_DEV`** — returns early / returns empty if not in development. This is defense-in-depth on top of the admin layout gate.

### 2. `src/app/admin/emails/page.tsx` — Email list page (server component)

Follows pattern of `src/app/admin/page.tsx`:
- `export const dynamic = "force-dynamic"`
- Calls `getEmails()`, passes to `<AdminEmailsClient>`

### 3. `src/app/admin/emails/[id]/page.tsx` — Email detail page (server component)

- Calls `getEmailById(id)`, returns `notFound()` if missing
- Passes full email (including `html`) to `<AdminEmailDetailClient>`

### 4. `src/components/admin/admin-emails-client.tsx` — Email list (`"use client"`)

Follows pattern of `admin-users-client.tsx`:
- Table with columns: Subject, To, Sent (relative time via `day().fromNow()`)
- Rows link to `/admin/emails/[id]`
- Empty state when no emails (using `Empty` component with `MailIcon`)

### 5. `src/components/admin/admin-email-detail-client.tsx` — Email detail (`"use client"`)

- Back link to `/admin/emails`
- Email metadata: subject (heading), to, sent time
- `<iframe srcdoc={html} sandbox="allow-same-origin" />` for email preview
  - `srcdoc` avoids needing an API route and sidesteps `X-Frame-Options: DENY` in `next.config.ts`
  - `allow-same-origin` lets us auto-resize iframe height via `contentDocument.body.scrollHeight`
  - Email HTML from `@react-email/components` is a full document — renders correctly in srcdoc

## Files to Modify

### 6. `src/lib/email.ts` — Store emails instead of logging HTML

In the `IS_DEV` branch, after rendering HTML:
- Call `addEmail({ to, subject, html, text })` from the email store
- Shorten the log line (just recipient + subject, not full HTML)
- Production branch unchanged

### 7. `src/app/admin/layout.tsx` — Add "Emails" nav link

Add `<Link href="/admin/emails">Emails</Link>` to the nav bar after "Organizations".

## Implementation Order

1. `src/lib/email-dev-store.ts` (foundation)
2. `src/lib/email.ts` (wire up store)
3. `src/components/admin/admin-emails-client.tsx` (list UI)
4. `src/components/admin/admin-email-detail-client.tsx` (detail UI)
5. `src/app/admin/emails/page.tsx` (list route)
6. `src/app/admin/emails/[id]/page.tsx` (detail route)
7. `src/app/admin/layout.tsx` (nav link)

## Key Patterns to Reuse

- `src/components/admin/admin-users-client.tsx` — table layout, component structure
- `src/app/admin/page.tsx` — server page pattern (dynamic, metadata, data fetch → client component)
- `src/components/common/empty.tsx` — Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription
- `src/components/common/table.tsx` — Table, TableHeader, TableBody, TableRow, TableHead, TableCell
- `src/lib/util.ts` — `IS_DEV`, `generateId`

## Verification

1. Start dev server (`bun dev`)
2. Trigger an email (e.g., sign up a new user to trigger verification email)
3. Navigate to `/admin/emails` — should see the email in the list
4. Click to open — should see metadata and a rendered HTML preview in the iframe
5. Verify the preview looks like a real email (Castparty header, styled content, footer)
6. Run `bun run build` to confirm no build errors
7. Run `bun run lint` to confirm no lint issues
