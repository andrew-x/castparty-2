# Add User Impersonation to Admin Page

## Context

The admin page (`/admin`) is a dev-only toolkit for managing users. We need the ability to impersonate any user to test the app from their perspective, and stop impersonating from the admin page.

better-auth's admin plugin already supports impersonation out of the box. The server plugin (`adminPlugin()`), client plugin (`adminClient()`), and database column (`session.impersonatedBy`) are all already configured. We just need to wire up the UI.

## Approach

Use better-auth's built-in impersonation methods:
- `authClient.admin.impersonateUser({ userId })` — start impersonating
- `authClient.admin.stopImpersonating()` — stop impersonating

**Role requirement:** better-auth requires the current user to have `role: "admin"` to impersonate. Since the admin page is already gated by `IS_DEV`, we auto-promote the current user to admin on first visit (dev convenience only).

## Changes

### 1. `src/app/admin/layout.tsx` — Add session awareness + impersonation banner

- Fetch session via `getSession()`
- If user is not impersonating and `role !== "admin"`, auto-set role to `"admin"` in DB (dev convenience)
- If `session.impersonatedBy` is set, render `<ImpersonationBanner>` above children with the impersonated user's name

### 2. `src/components/admin/impersonation-banner.tsx` — New client component

- Prominent banner: "You are impersonating **{name}**"
- "Stop impersonating" button
- Calls `authClient.admin.stopImpersonating()`
- On success: `router.push("/admin")` + refresh
- Loading state on button

### 3. `src/components/admin/admin-users-client.tsx` — Add impersonate button per row

- Add `currentUserId` prop to avoid showing button on own row
- Add impersonate icon button (e.g. `UserIcon` or `LogInIcon`) to the action buttons in each row
- On click: calls `authClient.admin.impersonateUser({ userId })`
- On success: `router.push("/")` to enter the app as that user
- Loading/disabled state while request is in-flight

### 4. `src/app/admin/page.tsx` — Pass current user ID

- Fetch session, pass `currentUserId` to `AdminUsersClient`

## Key Files

| File | Action |
|------|--------|
| `src/app/admin/layout.tsx` | Modify — session fetch, auto-promote, banner |
| `src/app/admin/page.tsx` | Modify — pass currentUserId |
| `src/components/admin/admin-users-client.tsx` | Modify — add impersonate button |
| `src/components/admin/impersonation-banner.tsx` | **New** — stop-impersonating banner |
| `src/lib/auth.ts` | Read-only — `getSession()` already returns `impersonatedBy` |
| `src/lib/auth/auth-client.ts` | Read-only — `adminClient()` already provides impersonation methods |
| `src/lib/db/schema.ts` | Read-only — `session.impersonatedBy` column exists |

## Reused Utilities

- `getSession()` from `src/lib/auth.ts` — session with `impersonatedBy` field
- `authClient` from `src/lib/auth/auth-client.ts` — `.admin.impersonateUser()` / `.stopImpersonating()`
- `IS_DEV` from `src/lib/util.ts` — already used for admin gating
- `Button`, `Badge`, `Alert` from `src/components/common/` — existing UI primitives
- `day` from `src/lib/dayjs` — date formatting
- `user` table + `db` for the auto-promote query

## Subagents

- **No subagents needed during implementation** — this is a focused 4-file change using existing patterns from the admin page.

## Verification

1. Run `bun run build` to verify no type errors
2. Run `bun run lint` to verify code style
3. Manual testing:
   - Visit `/admin` → see user list with new "Impersonate" button on each row (except your own)
   - Click "Impersonate" on a user → redirected to `/` as that user
   - Navigate to `/admin` → see impersonation banner with "Stop impersonating" button
   - Click "Stop impersonating" → back to your own session on the admin page
