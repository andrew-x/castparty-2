# Plan: Store Outbound Emails in Database

## Context

Emails sent to candidates (submission received, rejected, selected) are currently fire-and-forget — no record is persisted. This means the activity log on a submission has no visibility into what emails were sent. By storing emails in a dedicated `Email` table, we can surface them in the activity feed alongside feedback, comments, and stage changes. The schema is designed to also support future manual/free-form emails.

## 1. Add `Email` table to Drizzle schema

**File:** `src/lib/db/schema.ts`

Add a new `Email` table following the existing PascalCase convention:

```ts
export const Email = pgTable(
  "email",
  {
    id: text().primaryKey(),
    organizationId: text()
      .notNull()
      .references(() => Organization.id, { onDelete: "cascade" }),
    submissionId: text().references(() => Submission.id, { onDelete: "cascade" }),
    sentByUserId: text().references(() => User.id, { onDelete: "set null" }),

    toEmail: text().notNull(),
    subject: text().notNull(),
    bodyText: text().notNull(),
    bodyHtml: text().notNull(),
    templateType: text(),       // "submissionReceived" | "rejected" | "selected" | null (manual)
    status: text().notNull(),   // "sent" | "failed"

    sentAt: timestamp().defaultNow().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index("email_submissionId_idx").on(table.submissionId),
    index("email_organizationId_idx").on(table.organizationId),
  ],
)
```

Add relations:
- `emailRelations`: Email → Submission (one), Organization (one), User/sentBy (one)
- Update `submissionRelations`: add `emails: many(Email)`
- Update `organizationRelations`: add `emails: many(Email)`

Generate and run migration: `bun drizzle-kit generate` then `bun drizzle-kit migrate`.

## 2. Modify `sendEmail` to return rendered HTML

**File:** `src/lib/email.ts`

Currently `sendEmail` returns `void`. Change it to return `{ html: string }` so the caller can store the rendered HTML body. In dev mode it already renders HTML via `@react-email/components render()`. In prod, render the React element before passing to Resend.

```ts
export async function sendEmail({ to, subject, react, text }: SendEmailOptions): Promise<{ html: string }> {
  const { render } = await import("@react-email/components")
  const html = await render(react)

  if (IS_DEV) {
    addEmail({ to, subject, html, text })
    logger.info(`[Email] To: ${to} | Subject: ${subject}`)
    return { html }
  }

  const { Resend } = await import("resend")
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({ from, to, subject, html, text })
  return { html }
}
```

Note: Resend accepts either `react` or `html`. Since we need the HTML anyway, render first and pass `html` instead of `react`.

## 3. Insert email record on send

**File:** `src/actions/submissions/send-submission-email.tsx`

After a successful `sendEmail()` call, insert a row into the `Email` table.

In `sendSubmissionEmail()`:
- Accept an optional `sentByUserId` parameter (null for auto-sent emails)
- After `sendEmail()` succeeds, insert into Email table with status "sent"
- If `sendEmail()` throws, insert with status "failed" then re-throw
- Need the `organizationId` — already available via `submission.production.organization`; add the org ID to the production→organization columns query

In `sendSubmissionEmailAction`:
- Pass `ctx.user.id` as `sentByUserId` to `sendSubmissionEmail()`

In `create-submission.ts` (line ~286):
- The existing call `sendSubmissionEmail(submissionId, "submissionReceived")` needs the org ID. The `organizationId` is already available in that scope. Pass `null` for `sentByUserId` (auto-sent).

Updated signature:
```ts
export async function sendSubmissionEmail(
  submissionId: string,
  templateType: TemplateType,
  customSubject?: string,
  customBody?: string,
  sentByUserId?: string | null,
)
```

## 4. Add `EmailData` type and integrate into activity list

**File:** `src/lib/submission-helpers.ts`

Add new type:
```ts
export interface EmailData {
  id: string
  subject: string
  bodyText: string
  templateType: string | null
  sentBy: { name: string } | null
  sentAt: Date | string
  createdAt: Date | string
}
```

Extend `ActivityItem` union:
```ts
| { type: "email"; data: EmailData }
```

Add `emails` field to `SubmissionWithCandidate`:
```ts
emails: EmailData[]
```

Update `buildActivityList()` to include email items:
```ts
...submission.emails.map((e) => ({
  type: "email" as const,
  data: e,
})),
```

## 5. Fetch emails in submission detail query

**File:** `src/actions/productions/get-production-submissions.ts`

Add `emails` to the `submissions` `with` clause:
```ts
emails: {
  with: {
    sentBy: { columns: { name: true } },
  },
  orderBy: (e, { desc }) => [desc(e.sentAt)],
},
```

Map emails into the `SubmissionWithCandidate` shape in the loop (~line 126):
```ts
const emails: EmailData[] = sub.emails.map((e) => ({
  id: e.id,
  subject: e.subject,
  bodyText: e.bodyText,
  templateType: e.templateType,
  sentBy: e.sentBy,
  sentAt: e.sentAt,
  createdAt: e.createdAt,
}))
```

## 6. Render email activity items in feedback panel

**File:** `src/components/productions/feedback-panel.tsx`

Add a new `EmailItem` component:
- Icon: `MailIcon` from lucide-react
- Show sender name (or "System" if `sentBy` is null), subject line, and first ~100 chars of `bodyText` truncated
- Timestamp formatted with `day().format("LLL")`
- Style: similar to `StageChangeItem` but with a bit more content (border card like Comment)

Add `case "email"` to the activity list switch in `FeedbackPanel`.

Import `EmailData` type from `submission-helpers.ts`.

## Files Modified

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `Email` table, relations |
| `src/lib/email.ts` | Return `{ html }` from `sendEmail` |
| `src/actions/submissions/send-submission-email.tsx` | Insert Email row on send |
| `src/actions/submissions/create-submission.ts` | Pass org context to sendSubmissionEmail |
| `src/lib/submission-helpers.ts` | Add `EmailData` type, extend `ActivityItem`, update `buildActivityList` |
| `src/actions/productions/get-production-submissions.ts` | Include emails in submission query |
| `src/components/productions/feedback-panel.tsx` | Add `EmailItem` component, handle in switch |

## Verification

1. Run `bun drizzle-kit generate` — confirm migration creates the `email` table with correct columns/indexes
2. Run `bun drizzle-kit migrate` — apply migration
3. Run `bun run build` — confirm no type errors
4. Run `bun run lint` — confirm no lint issues
5. Manual testing (tell user):
   - Submit a new audition on a public form → check dev email store (`/admin/emails`) to confirm email sent
   - Open that submission's detail sheet → activity feed should show "Email sent: [subject]" with preview text
   - Move a submission to Rejected stage with email enabled → activity feed should show the rejection email
   - Move a submission to Selected stage → same check

## Agents

- **Subagent-driven development** for parallel implementation of independent steps (schema + email.ts can be done together; activity log changes depend on schema)
- **Code reviewer agent** after implementation to verify conventions
- **Librarian agent** to update `docs/FEATURES.md` with email storage feature
