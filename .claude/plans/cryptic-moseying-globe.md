# Third-Party Integration Audit — Findings & Fixes

## Context

Comprehensive audit of all major third-party integrations against their current
documentation and best practices. The codebase is generally well-integrated — no
critical security vulnerabilities or fundamentally wrong patterns. The findings below
are improvements, not emergencies.

---

## Priority Legend

- **P0** — Bug or correctness issue (fix now)
- **P1** — Deprecated API or best-practice gap (fix soon)
- **P2** — Performance or robustness improvement (nice to have)
- **P3** — Polish / defense-in-depth (backlog)

---

## Findings

### P0: Drizzle DB singleton is broken (connection leak in dev)

**File:** `src/lib/db/db.ts`

The global singleton pattern stores `db` in `globalForDrizzle.db` but never reads it
back. Every Next.js hot reload creates a new `Pool`, leaking connections.

**Fix:** Read from global before creating a new instance:

```ts
function createDb() {
  const pool = new Pool({ connectionString: databaseUrl })
  return drizzle({ schema, client: pool, casing: "snake_case" })
}

const globalForDrizzle = global as unknown as { db: ReturnType<typeof createDb> }
const db = globalForDrizzle.db ?? createDb()
if (process.env.NODE_ENV !== "production") globalForDrizzle.db = db
export default db
```

**Agent:** Direct edit, no subagent needed.

---

### P1: Zod v4 deprecated string methods

**Files:** `src/lib/schemas/auth.ts`, `submission.ts`, `organization.ts`, `candidate.ts`,
`simulate-inbound-email.ts`, `production.ts`, `role.ts`

Zod v4 deprecated `.email()` and `.url()` as string methods. The project uses
`z.string().trim().email("msg")` (9 occurrences) and `z.string().url()` (4 occurrences).

**Fix:** Replace with the v4 idiomatic pattern:

```ts
// Before
z.string().trim().email("Enter a valid email.")
z.string().url().or(z.literal("")).nullable().optional()

// After
z.string().trim().pipe(z.email({ error: "Enter a valid email." }))
z.string().pipe(z.url()).or(z.literal("")).nullable().optional()
```

Note: `src/actions/admin/create-user.ts` already uses the correct pattern.

**Agent:** Direct edit across ~7 schema files.

---

### P1: Inconsistent Zod import paths

**Files:** `src/lib/action.ts`, `src/lib/schemas/auth.ts`

These 2 files import `from "zod"` while the other 44+ files import `from "zod/v4"`.
Both resolve to v4 at runtime (since `zod@4.3.6` is installed), but `"zod/v4"` is the
canonical import per Zod v4 docs and project convention.

**Fix:** Change `from "zod"` to `from "zod/v4"` in both files.

**Agent:** Direct edit, 2 files.

---

### P1: Switch formResolver to standardSchemaResolver

**File:** `src/lib/schemas/resolve.ts`

The current `zodResolver` has known type compatibility issues with Zod v4 (tracked in
`@hookform/resolvers` issues #799 and #813), requiring two `any` casts. The
`standardSchemaResolver` (already in `bun.lock`) uses Zod v4's native Standard Schema
support and eliminates both casts.

**Fix:**

```ts
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import type { StandardSchemaV1 } from "@standard-schema/spec"

export function formResolver(schema: StandardSchemaV1) {
  return standardSchemaResolver(schema)
}
```

**Agent:** Direct edit, 1 file. Verify by running `bun run build`.

---

### P2: Better Auth session cookie caching

**File:** `src/lib/auth.ts`

Every `getSession()` call hits the database. Enabling cookie caching eliminates this
for the cache duration:

```ts
session: {
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // 5 minutes
  },
},
```

**Agent:** Direct edit, 1 file.

---

### P2: Better Auth experimental joins

**File:** `src/lib/auth.ts`

Schema already defines Drizzle relations. Enabling this reduces session query overhead:

```ts
experimental: {
  joins: true,
},
```

**Agent:** Direct edit, 1 file.

---

### P2: Resend singleton instead of per-call dynamic import

**File:** `src/lib/email.ts`

Currently creates a new `Resend` instance via dynamic import on every call. Resend's
Next.js guide instantiates at module scope.

**Fix:** Create module-level singleton:

```ts
import { Resend } from "resend"
const resend = new Resend(process.env.RESEND_API_KEY)
```

Remove the dynamic imports inside `sendEmail` and `sendBatchEmail`.

**Agent:** Direct edit, 1 file.

---

### P2: R2 move operations lack error handling on delete step

**File:** `src/lib/r2.ts`

In `moveFile` and `moveFileByKey`, if the copy succeeds but the delete fails, an
orphaned duplicate is created with no logging. Wrap the delete in try-catch with
logging.

**Agent:** Direct edit, 1 file.

---

### P2: Compact kanban card drag handle missing aria-label

**File:** `src/components/productions/kanban-card.tsx` (line 109-114)

The expanded card's drag handle has `aria-label="Drag to reorder"` but the compact
card's drag handle (line 109) does not.

**Fix:** Add `aria-label="Drag to reorder"` to the compact drag handle `<div>`.

**Agent:** Direct edit, 1 file.

---

### P2: Rich text editor toolbar missing ARIA role

**File:** `src/components/common/rich-text-editor.tsx` (line 96)

The toolbar `<div>` should have `role="toolbar"` and `aria-label="Formatting options"`.

**Fix:** Add both attributes to the toolbar div.

**Agent:** Direct edit, 1 file.

---

### P3: Better Auth trustedOrigins

**File:** `src/lib/auth.ts`

While Better Auth infers trusted origins from `baseURL`, explicitly listing them is a
defense-in-depth best practice:

```ts
trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
```

**Agent:** Direct edit, 1 file.

---

### P3: Webhook error response leaks config state

**File:** `src/app/api/webhooks/resend/route.ts` (line 25)

When `RESEND_WEBHOOK_SECRET` is missing, the response body says "Webhook secret not
configured". Change to a generic 500 message.

**Agent:** Direct edit, 1 file.

---

## What's Correct (No Changes Needed)

| Integration | Verdict |
|---|---|
| **Better Auth** API route (`toNextJsHandler`) | Current recommended pattern |
| **Better Auth** `nextCookies()` plugin (last in array) | Correct per docs |
| **Better Auth** `cache()` wrapping of `getSession` | Recommended dedup pattern |
| **Better Auth** `drizzleAdapter` with `"pg"` provider | Correct |
| **Better Auth** organization plugin config | Correct |
| **Better Auth** `additionalFields` for user model | Correct |
| **Better Auth** `inferAdditionalFields<Auth>()` on client | Correct |
| **Drizzle** `neon-serverless` driver (supports transactions) | Correct choice |
| **Drizzle** `casing: "snake_case"` in both config and connection | Correct |
| **next-safe-action** `createSafeActionClient` v8 API | Correct |
| **next-safe-action** middleware chaining pattern | Correct |
| **next-safe-action** `defineMetadataSchema` | Current recommended approach |
| **next-safe-action** error sanitization via `handleServerError` | Correct |
| **next-safe-action** React Hook Form adapter (`useHookFormAction`) | Correct |
| **Resend** batch API 100-email chunking | Correct |
| **Svix** webhook signature verification | Correct |
| **R2/S3** `requestChecksumCalculation: "WHEN_REQUIRED"` | Still required for R2 |
| **R2/S3** presigned URL 600s expiry | Appropriate |
| **R2/S3** module-level S3Client singleton | Correct |
| **Tiptap** `immediatelyRender: false` | Still required for SSR |
| **Tiptap** external value sync via useEffect | Acceptable pattern |
| **dnd-kit** v0.3.2 | Latest available, production-usable |
| **sanitize-html** allowlist approach | Correct |
| **dayjs** plugin wrapper pattern | Correct |

---

## Execution Plan

All fixes are direct edits (no subagents needed for implementation). Group by file
to minimize context switches:

### Step 1 — P0 fix
1. Fix Drizzle singleton in `src/lib/db/db.ts`

### Step 2 — P1 fixes (Zod)
2. Normalize `from "zod"` → `from "zod/v4"` in `src/lib/action.ts` and `src/lib/schemas/auth.ts`
3. Replace deprecated `.email()` → `.pipe(z.email())` across schema files
4. Replace deprecated `.url()` → `.pipe(z.url())` across schema files
5. Switch `formResolver` to `standardSchemaResolver` in `src/lib/schemas/resolve.ts`

### Step 3 — P2 fixes
6. Add Better Auth `session.cookieCache` and `experimental.joins` in `src/lib/auth.ts`
7. Make Resend a module-level singleton in `src/lib/email.ts`
8. Add try-catch on R2 move delete steps in `src/lib/r2.ts`
9. Add `aria-label` to compact kanban drag handle in `kanban-card.tsx`
10. Add `role="toolbar"` to rich text editor toolbar in `rich-text-editor.tsx`

### Step 4 — P3 fixes
11. Add `trustedOrigins` to Better Auth config
12. Sanitize webhook error response

### Verification
- `bun run build` — must pass (catches type errors from Zod/resolver changes)
- `bun run lint` — must pass
- Manual check: visit any form page to confirm form validation still works
- Manual check: verify auth flows (login, signup) still work with cookie caching
