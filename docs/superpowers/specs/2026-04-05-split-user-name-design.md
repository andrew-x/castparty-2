# Split User Name into First/Last Name

## Context

Users currently have a single `name` field. For a casting ATS, having separate first and last names is important — it matches how names appear on headshots, programs, and casting notices. This change splits the single `name` into `firstName` and `lastName` across the entire stack: database, auth, forms, display, emails, and seed data.

## Approach

Use Better Auth's `additionalFields` to add `firstName` and `lastName` to the user model. The built-in `name` field cannot be removed (Better Auth requires it), so it stays as a computed concatenation of `firstName + " " + lastName`. All application code reads from `firstName`/`lastName` directly; `name` exists only for Better Auth compatibility.

Both fields are required.

## Changes

### 1. Better Auth config — `src/lib/auth.ts`

Add `user.additionalFields`:

```ts
user: {
  additionalFields: {
    firstName: { type: "string", required: true, input: true },
    lastName: { type: "string", required: true, input: true },
  },
},
```

Update email callbacks to use `user.firstName` for greetings:
- `sendResetPassword`: `PasswordResetEmail({ name: user.firstName, ... })`
- `sendVerificationEmail`: `VerifyEmailEmail({ name: user.firstName, ... })`
- `sendInvitationEmail`: inviter name becomes `${data.inviter.user.firstName} ${data.inviter.user.lastName}`

### 2. Database schema — `src/lib/db/schema.ts`

Add columns to the `user` table:

```ts
firstName: text("first_name").notNull(),
lastName: text("last_name").notNull(),
```

The existing `name` column stays (Better Auth requires it).

### 3. Auth client — `src/lib/auth/auth-client.ts`

Add `inferAdditionalFields` plugin for type safety:

```ts
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    organizationClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})
```

### 4. Signup — schema + form

**Schema** (`src/lib/schemas/auth.ts`):

Replace `name` with:
```ts
firstName: z.string().trim().min(1, "First name is required."),
lastName: z.string().trim().min(1, "Last name is required."),
```

**Form** (`src/components/auth/signup-form.tsx`):

- Two fields: "First name" (`autoComplete="given-name"`) and "Last name" (`autoComplete="family-name"`)
- Submit: `authClient.signUp.email({ name: \`${firstName} ${lastName}\`, firstName, lastName, ... })`

### 5. Admin create user — action + dialog

**Action** (`src/actions/admin/create-user.ts`):

Schema gets `firstName`/`lastName`. Computes `name` for `auth.api.signUpEmail`:
```ts
body: {
  name: `${firstName} ${lastName}`,
  firstName,
  lastName,
  email,
  password,
}
```

**Dialog** (`src/components/admin/add-user-dialog.tsx`):

Replace single "Name" field with "First name" and "Last name" fields.

### 6. Display logic

All places that read `user.name` switch to using `firstName`/`lastName`:

| File | Change |
|------|--------|
| `src/app/(app)/layout.tsx` | Pass `firstName`, `lastName` instead of `name` |
| `src/components/app/top-nav.tsx` | Update `Props` interface: `{ firstName: string; lastName: string; ... }` |
| `src/components/organizations/org-switcher.tsx` | Update `Props` interface. Display: `` `${user.firstName} ${user.lastName}` ``. `getInitials`: use `user.firstName[0]` + `user.lastName[0]`. |
| `src/app/(app)/home/page.tsx` | Greeting: `` `Welcome, ${user?.firstName}.` `` |
| `src/components/admin/admin-users-client.tsx` | `AdminUser` interface gets `firstName`/`lastName`. Table cell: `` `${u.firstName} ${u.lastName}` `` |
| `src/actions/admin/get-users.ts` | Select `firstName`, `lastName` instead of `name` |
| `src/app/admin/layout.tsx` | Impersonation banner: `` `${user.firstName} ${user.lastName}` `` |
| `src/components/admin/impersonation-banner.tsx` | No change needed (receives a string prop) |
| `src/components/admin/change-password-dialog.tsx` | Display: `` `${user.firstName} ${user.lastName}` `` — update the `user` prop type |
| `src/actions/organizations/get-organization.ts` | Select `firstName`/`lastName` from user, compute `userName: \`${firstName} ${lastName}\`` — downstream components keep receiving a string |
| `src/components/organizations/members-table.tsx` | No interface change needed (`userName` stays a string) |
| `src/components/organizations/change-role-dialog.tsx` | No change needed |
| `src/components/organizations/remove-member-dialog.tsx` | No change needed |
| `src/components/organizations/transfer-ownership-dialog.tsx` | No change needed |
| `src/components/productions/feedback-panel.tsx` | `getInitials` already splits on spaces — pass full name string, no change needed |

### 7. Email templates

| File | Change |
|------|--------|
| `src/lib/emails/password-reset.tsx` | Greeting stays `Hi {name},` — caller passes `firstName` |
| `src/lib/emails/verify-email.tsx` | Same — caller passes `firstName` |
| `src/lib/emails/invitation.tsx` | `inviterName` prop receives full name string — no template change |

The email template components themselves don't change (they accept a `name` string prop). The callers in `src/lib/auth.ts` pass the right value.

### 8. Seed data — `src/actions/admin/seed-data.ts`

Replace:
```ts
const DEV_USER_NAME = "Dev User"
```

With:
```ts
const DEV_USER_FIRST_NAME = "Dev"
const DEV_USER_LAST_NAME = "User"
```

Pass to signup:
```ts
body: {
  name: `${DEV_USER_FIRST_NAME} ${DEV_USER_LAST_NAME}`,
  firstName: DEV_USER_FIRST_NAME,
  lastName: DEV_USER_LAST_NAME,
  ...
}
```

### 9. Database migration

A Drizzle migration that:
1. Adds `first_name` and `last_name` columns as nullable text
2. Populates from existing `name`: first word -> `first_name`, remainder -> `last_name` (fallback: copy `name` to both if single word)
3. Alters both columns to NOT NULL

## Files to modify

1. `src/lib/auth.ts` — additionalFields + email callbacks
2. `src/lib/db/schema.ts` — add columns
3. `src/lib/auth/auth-client.ts` — inferAdditionalFields plugin
4. `src/lib/schemas/auth.ts` — signup schema
5. `src/components/auth/signup-form.tsx` — signup form
6. `src/actions/admin/create-user.ts` — admin create action
7. `src/components/admin/add-user-dialog.tsx` — admin create dialog
8. `src/app/(app)/layout.tsx` — pass new fields to nav
9. `src/components/app/top-nav.tsx` — update props interface
10. `src/components/organizations/org-switcher.tsx` — update props + display
11. `src/app/(app)/home/page.tsx` — welcome greeting
12. `src/actions/admin/get-users.ts` — select new columns
13. `src/components/admin/admin-users-client.tsx` — admin user table
14. `src/app/admin/layout.tsx` — impersonation banner
15. `src/components/admin/change-password-dialog.tsx` — dialog description
16. `src/actions/organizations/get-organization.ts` — member mapping
17. `src/components/organizations/members-table.tsx` — member display
18. `src/components/organizations/change-role-dialog.tsx` — member name
19. `src/components/organizations/remove-member-dialog.tsx` — member name
20. `src/components/organizations/transfer-ownership-dialog.tsx` — member name
21. `src/actions/admin/seed-data.ts` — seed constants + signup call
22. New migration file via `bunx drizzle-kit generate`

## Verification

1. **Build**: `bun run build` passes with no type errors
2. **Lint**: `bun run lint` passes
3. **Migration**: `bunx drizzle-kit generate` produces a valid migration
4. **Manual checks** (for the user):
   - Sign up with first/last name — both fields visible, both required
   - Admin > Add user — two name fields
   - Admin > Users table — shows full name
   - Home page — "Welcome, {firstName}."
   - Top nav avatar — shows initials from first + last name
   - Org members table — shows full names
   - Seed data — dev user created with first/last name
