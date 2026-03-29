## Architecture & Security Audit

### Critical

- **[src/actions/admin/get-orphaned-orgs.ts:7]**: Missing `IS_DEV` guard on `getOrganizations()` server function. Unlike `get-users.ts` (which has `if (!IS_DEV) throw`) and the mutation actions (which use `adminActionClient` with built-in `IS_DEV` check), this read function has no production guard. While the admin layout (`src/app/admin/layout.tsx:15`) blocks rendering with `if (!IS_DEV) notFound()`, the server function itself is a `"use server"` export and can be imported and called directly from any client component, bypassing the layout guard. In production, this would expose all organization names, slugs, creation dates, and member/production counts to any authenticated user. — Add `if (!IS_DEV) throw new Error("Not available in production")` at the top of the function, matching the pattern in `get-users.ts`.

### Important

- **[src/actions/submissions/create-submission.ts:114]**: `CHECKBOX_GROUP` required-field validation uses `!value?.trim()`. For checkbox groups, the value is a comma-joined string (e.g., `"Option A,Option B"`). An empty selection is `""` which correctly fails, but this remains a fragile validation approach — if a field has options with only whitespace names, `" , ".trim()` would be `","` (truthy) and incorrectly pass. This is the remaining half of Known Issue #3 (the TOGGLE half was fixed). — Add an explicit `CHECKBOX_GROUP` branch that splits on comma and checks the resulting array has at least one non-empty element, similar to how TOGGLE now has its own branch.

- **[src/lib/action.ts:5]**: Uses bare `import { z } from "zod"` instead of `"zod/v4"`. Known Issue #10 documents that auth schemas intentionally use bare `"zod"` for Better Auth compatibility, but `action.ts` is not auth-related — it uses `z` for `defineMetadataSchema` in the next-safe-action client. This is likely a similar library compatibility requirement (next-safe-action may expect unversioned zod), but it is not documented in Known Issue #10 or ADR-009. — Verify whether next-safe-action works with `"zod/v4"`. If it does, migrate. If not, add `action.ts` to the documented exceptions in Known Issue #10.

- **[src/actions/submissions/presign-headshot-upload.ts:41, src/actions/submissions/presign-resume-upload.ts:22]**: Presigned upload endpoints use `publicActionClient` (no authentication). This is intentional for the public submission flow, but it means anyone who discovers the action can generate unlimited presigned R2 upload URLs without submitting a form. There is no rate limiting or abuse prevention. — Consider adding a lightweight rate limit (e.g., per-IP throttle) or tying presign requests to an active submission session token to prevent storage abuse.

### Minor

- **[src/lib/schemas/production.ts:7]**: The `roleItemSchema` has the error message `"Role name is required."` which is correct, but the `createProductionFormSchema` on line 12 also says `"Production name is required."` — these are fine. However, the `roleItemSchema.name` field validation message is potentially confusing when reused in `createProductionActionSchema.roles` context since it says "Role name" but is nested under the production creation schema. This is cosmetic and low-impact.

- **[src/components/common/sidebar.tsx:605]**: Uses `React.useMemo` with `[]` deps for `Math.random()`. Per the React Compiler rules in `.claude/rules/react.md`, this is an explicitly documented exception — `useMemo` with empty deps for non-deterministic values that need run-once stability. No action needed; this is correctly used.

### Known Issues Cross-Reference

| # | Status | Notes |
|---|--------|-------|
| 1 | **Fixed** | `getCandidate` now filters by `organizationId` in the query `where` clause itself (line 21), no wasteful fetch-then-discard. |
| 2 | **Fixed** | Confirmed closed per docs (subquery filters by `roleId`; stages are production-scoped). |
| 3 | **Partially open** | TOGGLE validation fixed (line 112-113 checks `value !== "true"`). CHECKBOX_GROUP still uses the generic `!value?.trim()` path (line 114). See Important finding above. |
| 4 | **Fixed** | Confirmed closed per docs. |
| 5 | **Fixed** | Confirmed closed per docs. |
| 6 | **Fixed** | `createSubmission` uses `db.transaction()` (line 215). |
| 7 | **Fixed** | Confirmed closed per docs. |
| 8 | **Fixed** | `getPublicProduction` now checks `production.status !== "open"` on line 24 and returns `null`. The docs should be updated to mark this as fixed. |
| 9 | **Fixed** | Confirmed closed per docs. |
| 10 | **Still open** | Auth schemas use bare `"zod"` as documented. Additionally, `src/lib/action.ts` uses bare `"zod"` (not documented in this issue). |
| 11 | **Fixed** | Confirmed closed per docs. |

### No Issues Found In

- **XSS vectors**: No `dangerouslySetInnerHTML` usage anywhere in `src/`.
- **Direct DB queries in pages/components**: No `db.` calls found in `src/app/` or `src/components/`.
- **Exposed secrets**: All secrets accessed via `process.env` in server-only files. No hardcoded credentials.
- **Path alias**: All imports use `@/*` consistently. No relative imports (`../`) found.
- **dayjs wrapper**: All dayjs usage imports from `@/lib/dayjs`. The only direct `dayjs` import is in the wrapper file itself (`src/lib/dayjs.ts`).
- **ESLint/Prettier artifacts**: None found. Project uses Biome exclusively.
- **Barrel files**: Only `src/lib/schemas/index.ts` exists as a barrel, as allowed.
- **Auth on protected routes**: `(app)/layout.tsx` enforces auth via `getCurrentUser()` redirect. Admin layout enforces `IS_DEV` check. All mutation actions use `secureActionClient` or `adminActionClient`. All read functions in `src/actions/` (except public/admin ones) call `checkAuth()`.
- **Webhook security**: Resend webhook endpoint validates Svix signatures before processing.
- **`new Date()` usage**: Only in `$onUpdate` callbacks in `schema.ts` (Drizzle ORM requirement — dayjs is not applicable here). All application code uses the `day()` wrapper.
- **`.trim()` on schemas**: All user text input schemas include `.trim()`. Passwords correctly omit it.
