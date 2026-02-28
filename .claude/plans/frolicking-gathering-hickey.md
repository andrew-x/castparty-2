# Plan: Dev-Only Admin Route (`/admin`)

## Context

We need a local-dev-only admin page for managing users (list, create, delete, change passwords). This is a developer tool for bootstrapping and debugging — not a user-facing feature. The app currently has no `src/actions/` directory, so this introduces the first server actions following the newly established backend conventions.

## Approach

- Top-level route at `src/app/admin/` (outside the `(app)` route group, no sidebar)
- Gated by `IS_DEV` in the layout — returns `notFound()` in production
- No auth required (dev tool — avoids chicken-and-egg problem with no users)
- Follows new backend conventions: actions in `src/actions/admin/`, writes via `next-safe-action` with `.inputSchema()`, reads via plain server functions
- Enable Better Auth's admin plugin server-side for user management APIs
- Match existing form patterns from `signup-form.tsx` (Controller + Field components)

## Files to Create/Modify

### Modify

| File | Change |
|------|--------|
| `src/lib/auth.ts` | Add `admin` plugin to server-side Better Auth config |

### Create

| File | Purpose |
|------|---------|
| `src/actions/admin/index.ts` | Write actions: `createUserAction`, `deleteUserAction`, `changePasswordAction` |
| `src/actions/admin/queries.ts` | Read function: `getUsers()` — plain async server function |
| `src/app/admin/layout.tsx` | Dev gate (`IS_DEV` check), minimal page shell |
| `src/app/admin/page.tsx` | Server component: calls `getUsers()`, renders client component |
| `src/components/admin/admin-users-client.tsx` | Client component: user table + dialog state management |
| `src/components/admin/add-user-dialog.tsx` | Form dialog for creating a user (name, email, password) |
| `src/components/admin/change-password-dialog.tsx` | Form dialog for changing a user's password |
| `src/components/admin/delete-user-dialog.tsx` | AlertDialog for confirming user deletion |

## Implementation Details

### 1. Enable admin plugin (`src/lib/auth.ts`)

Add `admin` import from `better-auth/plugins` and include it in the plugins array. This unlocks `auth.api.admin.removeUser()` and `auth.api.admin.setUserPassword()`.

### 2. Read function (`src/actions/admin/queries.ts`)

Per conventions, reads are plain async functions called directly from server components. No `checkAuth()` needed since this is a dev-only page with no session.

### 3. Write actions (`src/actions/admin/index.ts`)

All three actions use `publicActionClient` (no session in admin layout). Each guards with `requireDev()`.

Convention compliance:
- `import { z } from "zod/v4"` per new conventions
- `.inputSchema()` method per new conventions
- `.metadata({ action: "kebab-case" })` — e.g. `"create-user"`, `"delete-user"`, `"change-password"`

Actions:
- **`createUserAction`** — calls `auth.api.signUpEmail()` (handles hashing + triggers personal org creation hook)
- **`deleteUserAction`** — calls `auth.api.admin.removeUser()` (cascades via FK constraints)
- **`changePasswordAction`** — calls `auth.api.admin.setUserPassword()`

**Fallback**: If admin API methods require session headers, fall back to Drizzle direct queries + Better Auth's internal password hashing.

### 4. Layout (`src/app/admin/layout.tsx`)

Checks `IS_DEV` and calls `notFound()` if false. Renders a minimal shell — "Dev only" caption + "Admin" title, max-w-4xl centered. Uses design tokens (`px-page`, `gap-section`, `font-serif`, `text-title`).

### 5. Page (`src/app/admin/page.tsx`)

Server component. Calls `getUsers()` from `@/actions/admin/queries`. Passes data to `AdminUsersClient`.

### 6. Client components

**`admin-users-client.tsx`** — User count, "Add user" button, table with columns (Name, Email, Verified, Created, Actions). Per-row action buttons: key icon (change password), trash icon (delete). Manages dialog open/close state. Calls `router.refresh()` after mutations.

**`add-user-dialog.tsx`** — Dialog with react-hook-form + zodResolver. Three fields: name, email, password. Uses `useAction(createUserAction)`. Matches signup-form.tsx patterns exactly (Controller, Field, FieldLabel, FieldError, aria-invalid).

**`change-password-dialog.tsx`** — Dialog with single password field. Shows target user's name in the description. Resets form on close.

**`delete-user-dialog.tsx`** — AlertDialog (destructive action pattern). Shows user name + email in description. Uses `AlertDialogAction` with `variant="destructive"`.

### Existing components reused

All from `src/components/common/`: Button, Table (full set), Badge, Dialog (full set), AlertDialog (full set), Field/FieldError/FieldGroup/FieldLabel, Input, Alert/AlertDescription.

### Key patterns to match

- Form pattern: `src/components/auth/signup-form.tsx` (Controller + Field + FieldError + aria-invalid)
- Action client: `src/lib/action.ts` (publicActionClient with metadata)
- Route guard: `src/app/(app)/layout.tsx` (layout-level gating)
- Date formatting: `day(date).format("MMM D, YYYY")` via `@/lib/dayjs`

## Verification

1. `bun run build` — type check
2. `bun run lint` — Biome compliance
3. Manual: visit `/admin` on local dev — should show user table
4. Manual: add a user, verify they appear
5. Manual: change a user's password, verify login with new password
6. Manual: delete a user, verify removal
7. In production mode, `/admin` should return 404

## Agents

- **dev-docs skill** to verify Better Auth admin plugin server-side API during implementation
- **Subagent-driven development** for parallel implementation of independent files
- **Code reviewer** after implementation to check against project conventions
