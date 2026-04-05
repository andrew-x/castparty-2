# Split User Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single user `name` field with separate `firstName` and `lastName` fields across auth, database, forms, display, emails, and seed data.

**Architecture:** Better Auth's `additionalFields` adds `firstName`/`lastName` to the user model. The built-in `name` column stays as a computed `"${firstName} ${lastName}"` for Better Auth compatibility. All app code reads from `firstName`/`lastName`. The drizzle config uses `casing: "snake_case"` so camelCase fields auto-map to snake_case columns.

**Tech Stack:** Better Auth, Drizzle ORM (PostgreSQL), Next.js App Router, React Hook Form, Zod, next-safe-action

**Spec:** `docs/superpowers/specs/2026-04-05-split-user-name-design.md`

---

### Task 1: Database schema + Better Auth config + auth client

**Files:**
- Modify: `src/lib/db/schema.ts:22-37` (user table)
- Modify: `src/lib/auth.ts:19-93` (betterAuth config)
- Modify: `src/lib/auth/auth-client.ts:1-6` (client plugins)

- [ ] **Step 1: Add firstName/lastName columns to the user table in Drizzle schema**

In `src/lib/db/schema.ts`, add two columns after the `name` column:

```ts
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})
```

Note: No explicit column name needed — the drizzle config has `casing: "snake_case"` which auto-maps `firstName` to `first_name` and `lastName` to `last_name`.

- [ ] **Step 2: Add additionalFields to Better Auth config**

In `src/lib/auth.ts`, add the `user` config block inside `betterAuth({...})`, right after the `baseURL` property:

```ts
export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`,
  user: {
    additionalFields: {
      firstName: { type: "string", required: true, input: true },
      lastName: { type: "string", required: true, input: true },
    },
  },
  emailAndPassword: {
    // ... rest unchanged
```

- [ ] **Step 3: Update email callbacks in auth config to use firstName**

In the same file `src/lib/auth.ts`, update the three email callbacks:

In `sendResetPassword` (line 30), change:
```ts
react: PasswordResetEmail({ name: user.name, resetUrl }),
```
to:
```ts
react: PasswordResetEmail({ name: user.firstName, resetUrl }),
```

In `sendVerificationEmail` (line 43), change:
```ts
react: VerifyEmailEmail({ name: user.name, verifyUrl }),
```
to:
```ts
react: VerifyEmailEmail({ name: user.firstName, verifyUrl }),
```

In `sendInvitationEmail` (lines 83, 87), change:
```ts
inviterName: data.inviter.user.name,
```
to:
```ts
inviterName: `${data.inviter.user.firstName} ${data.inviter.user.lastName}`,
```

And change the text line:
```ts
text: `${data.inviter.user.name} invited you to ${data.organization.name}. Accept here: ${acceptUrl}`,
```
to:
```ts
text: `${data.inviter.user.firstName} ${data.inviter.user.lastName} invited you to ${data.organization.name}. Accept here: ${acceptUrl}`,
```

- [ ] **Step 4: Add inferAdditionalFields to auth client**

Replace the entire contents of `src/lib/auth/auth-client.ts` with:

```ts
import {
  adminClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import type { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    organizationClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})
```

- [ ] **Step 5: Verify build compiles**

Run: `bun run build`

Expected: Build succeeds (existing usages of `user.name` still work since we haven't removed the column).

---

### Task 2: Signup schema + form

**Files:**
- Modify: `src/lib/schemas/auth.ts:3-7` (signUpSchema)
- Modify: `src/components/auth/signup-form.tsx` (full file)

- [ ] **Step 1: Update the signup schema**

In `src/lib/schemas/auth.ts`, replace the `signUpSchema`:

```ts
export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})
```

- [ ] **Step 2: Update the signup form**

In `src/components/auth/signup-form.tsx`, update the form:

Change `defaultValues` (line 32):
```ts
defaultValues: { firstName: "", lastName: "", email: "", password: "" },
```

Change `onSubmit` (lines 35-41):
```ts
async function onSubmit(values: z.infer<typeof signUpSchema>) {
  const { error: authError } = await authClient.signUp.email({
    name: `${values.firstName} ${values.lastName}`,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    password: values.password,
    callbackURL: "/auth/verify-email",
  })
```

Replace the single "Name" Controller (lines 59-75) with two Controllers:

```tsx
<Controller
  name="firstName"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>First name</FieldLabel>
      <Input
        {...field}
        id={field.name}
        type="text"
        autoComplete="given-name"
        aria-invalid={fieldState.invalid}
      />
      {fieldState.error && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
<Controller
  name="lastName"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
      <Input
        {...field}
        id={field.name}
        type="text"
        autoComplete="family-name"
        aria-invalid={fieldState.invalid}
      />
      {fieldState.error && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

- [ ] **Step 3: Verify build compiles**

Run: `bun run build`

Expected: Build succeeds.

---

### Task 3: Admin create user — action + dialog

**Files:**
- Modify: `src/actions/admin/create-user.ts` (full file)
- Modify: `src/components/admin/add-user-dialog.tsx` (full file)

- [ ] **Step 1: Update the create user action schema and handler**

Replace the content of `src/actions/admin/create-user.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { adminActionClient } from "@/lib/action"
import { auth } from "@/lib/auth"

export const createUserAction = adminActionClient
  .metadata({ action: "create-user" })
  .inputSchema(
    z.object({
      firstName: z.string().trim().min(1),
      lastName: z.string().trim().min(1),
      email: z.string().trim().pipe(z.email()),
      password: z.string().min(8),
    }),
  )
  .action(async ({ parsedInput: { firstName, lastName, email, password } }) => {
    await auth.api.signUpEmail({
      body: {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        password,
      },
    })
    revalidatePath("/", "layout")
    return { success: true }
  })
```

- [ ] **Step 2: Update the add user dialog form**

In `src/components/admin/add-user-dialog.tsx`, update:

Change the schema (lines 25-29):
```ts
const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})
```

Change `defaultValues` (line 42):
```ts
formProps: { defaultValues: { firstName: "", lastName: "", email: "", password: "" } },
```

Replace the single "Name" Controller (lines 66-84) with two Controllers:

```tsx
<Controller
  name="firstName"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>First name</FieldLabel>
      <Input
        {...field}
        id={field.name}
        type="text"
        autoComplete="given-name"
        aria-invalid={fieldState.invalid}
      />
      {fieldState.error && (
        <FieldError errors={[fieldState.error]} />
      )}
    </Field>
  )}
/>
<Controller
  name="lastName"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
      <Input
        {...field}
        id={field.name}
        type="text"
        autoComplete="family-name"
        aria-invalid={fieldState.invalid}
      />
      {fieldState.error && (
        <FieldError errors={[fieldState.error]} />
      )}
    </Field>
  )}
/>
```

- [ ] **Step 3: Verify build compiles**

Run: `bun run build`

Expected: Build succeeds.

---

### Task 4: Navigation display — layout, top-nav, org-switcher

**Files:**
- Modify: `src/app/(app)/layout.tsx:30-35` (user prop)
- Modify: `src/components/app/top-nav.tsx:35-36` (Props interface)
- Modify: `src/components/organizations/org-switcher.tsx:32-45,91-108` (Props + display)

- [ ] **Step 1: Update app layout to pass firstName/lastName**

In `src/app/(app)/layout.tsx`, change the user prop (lines 31-35):

```tsx
user={{
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  image: user.image,
}}
```

- [ ] **Step 2: Update TopNav Props interface**

In `src/components/app/top-nav.tsx`, change the Props interface (line 36):

```ts
interface Props {
  user: { firstName: string; lastName: string; email: string; image?: string | null }
  organizations: OrgSwitcherOrg[]
  activeOrgId: string | null
  activeOrgRole: string | null
  pendingInvitations: UserInvitation[]
}
```

- [ ] **Step 3: Update OrgSwitcher Props and display**

In `src/components/organizations/org-switcher.tsx`:

Change the Props interface (line 33):
```ts
interface Props {
  user: { firstName: string; lastName: string; email: string; image?: string | null }
  organizations: OrgSwitcherOrg[]
  activeOrgId: string | null
}
```

Replace the `getInitials` function (lines 38-45):
```ts
function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}
```

Update the avatar section (lines 90-101):
```tsx
<Avatar>
  {user.image && <AvatarImage src={user.image} alt={`${user.firstName} ${user.lastName}`} />}
  <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
</Avatar>
<div className="hidden text-left leading-tight md:grid">
  <span className="truncate font-medium text-label">
    {user.firstName} {user.lastName}
  </span>
  <span className="truncate text-caption text-muted-foreground">
    {activeOrg?.name ?? user.email}
  </span>
</div>
```

Update the popover header (lines 107-111):
```tsx
<div className="px-2 py-1.5">
  <p className="truncate font-medium text-label">{user.firstName} {user.lastName}</p>
  <p className="truncate text-caption text-muted-foreground">
    {user.email}
  </p>
</div>
```

- [ ] **Step 4: Verify build compiles**

Run: `bun run build`

Expected: Build succeeds.

---

### Task 5: Home page greeting + admin display

**Files:**
- Modify: `src/app/(app)/home/page.tsx:42` (welcome message)
- Modify: `src/actions/admin/get-users.ts:11-17` (select columns)
- Modify: `src/components/admin/admin-users-client.tsx:30-36,106-108` (interface + display)
- Modify: `src/components/admin/change-password-dialog.tsx:32,74` (prop type + display)
- Modify: `src/components/admin/delete-user-dialog.tsx:19,56` (prop type + display)
- Modify: `src/app/admin/layout.tsx:32` (impersonation banner)

- [ ] **Step 1: Update home page greeting**

In `src/app/(app)/home/page.tsx`, change line 42:

```tsx
<PageHeader title={`Welcome, ${user?.firstName}.`} />
```

- [ ] **Step 2: Update get-users action to select new columns**

In `src/actions/admin/get-users.ts`, update the columns:

```ts
return db.query.user.findMany({
  columns: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    emailVerified: true,
    createdAt: true,
  },
  orderBy: (u) => desc(u.createdAt),
})
```

- [ ] **Step 3: Update AdminUser interface and table display**

In `src/components/admin/admin-users-client.tsx`, change the `AdminUser` interface (lines 30-36):

```ts
export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  emailVerified: boolean
  createdAt: Date
}
```

Change the table cell that displays the name (lines 106-108):
```tsx
<TableCell className="font-medium text-foreground">
  {u.firstName} {u.lastName}
</TableCell>
```

- [ ] **Step 4: Update change password dialog prop type**

In `src/components/admin/change-password-dialog.tsx`, change the Props interface (line 32):

```ts
interface Props {
  user: { id: string; firstName: string; lastName: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}
```

Change line 74:
```tsx
Set a new password for {user.firstName} {user.lastName}.
```

- [ ] **Step 5: Update delete user dialog prop type**

In `src/components/admin/delete-user-dialog.tsx`, change the Props interface (line 19):

```ts
interface Props {
  user: { id: string; firstName: string; lastName: string; email: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}
```

Change line 56:
```tsx
This will permanently delete {user?.firstName} {user?.lastName} ({user?.email}) and all
associated data. This cannot be undone.
```

- [ ] **Step 6: Update admin layout impersonation banner**

In `src/app/admin/layout.tsx`, change line 32:

```tsx
<ImpersonationBanner userName={`${sessionData.user?.firstName ?? ""} ${sessionData.user?.lastName ?? ""}`.trim() || "Unknown"} />
```

- [ ] **Step 7: Verify build compiles**

Run: `bun run build`

Expected: Build succeeds.

---

### Task 6: Organization members display

**Files:**
- Modify: `src/actions/organizations/get-organization.ts:29-33,50` (select columns + mapping)

- [ ] **Step 1: Update get-organization to use firstName/lastName**

In `src/actions/organizations/get-organization.ts`, update the user columns selection (lines 29-34):

```ts
user: {
  columns: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    image: true,
  },
},
```

Update the member mapping (line 50):
```ts
userName: `${m.user.firstName} ${m.user.lastName}`,
```

The downstream components (`members-table.tsx`, `change-role-dialog.tsx`, `remove-member-dialog.tsx`, `transfer-ownership-dialog.tsx`) all receive `userName` as a string and need no changes.

- [ ] **Step 2: Verify build compiles**

Run: `bun run build`

Expected: Build succeeds.

---

### Task 7: Seed data

**Files:**
- Modify: `src/actions/admin/seed-data.ts:37-39,248-253` (constants + signup call)

- [ ] **Step 1: Update seed data constants and signup call**

In `src/actions/admin/seed-data.ts`, replace the constants (lines 37-39):

```ts
const DEV_USER_EMAIL = "dev@test.com"
const DEV_USER_PASSWORD = "password"
const DEV_USER_FIRST_NAME = "Dev"
const DEV_USER_LAST_NAME = "User"
```

Update the signup call (lines 248-254):

```ts
const signUpResult = await auth.api.signUpEmail({
  body: {
    name: `${DEV_USER_FIRST_NAME} ${DEV_USER_LAST_NAME}`,
    firstName: DEV_USER_FIRST_NAME,
    lastName: DEV_USER_LAST_NAME,
    email: DEV_USER_EMAIL,
    password: DEV_USER_PASSWORD,
  },
})
```

- [ ] **Step 2: Verify build compiles**

Run: `bun run build`

Expected: Build succeeds.

---

### Task 8: Generate migration + lint

**Files:**
- New: `src/lib/db/drizzle/XXXX_*.sql` (auto-generated migration)

- [ ] **Step 1: Generate the Drizzle migration**

Run: `bunx drizzle-kit generate`

Expected: A new migration SQL file is created in `src/lib/db/drizzle/`. It should contain statements adding `first_name` and `last_name` columns to the `user` table.

- [ ] **Step 2: Review and edit the generated migration**

The auto-generated migration will add the columns as NOT NULL without defaults, which will fail if existing rows exist. Edit the generated SQL file to use a safe 3-step approach:

```sql
-- Step 1: Add columns as nullable
ALTER TABLE "user" ADD COLUMN "first_name" text;
ALTER TABLE "user" ADD COLUMN "last_name" text;

-- Step 2: Populate from existing name
UPDATE "user" SET
  "first_name" = split_part("name", ' ', 1),
  "last_name" = CASE
    WHEN position(' ' in "name") > 0
    THEN substring("name" from position(' ' in "name") + 1)
    ELSE "name"
  END;

-- Step 3: Make NOT NULL
ALTER TABLE "user" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "user" ALTER COLUMN "last_name" SET NOT NULL;
```

- [ ] **Step 3: Run lint**

Run: `bun run lint`

Expected: No errors. Fix any formatting issues with `bun run format` if needed.

- [ ] **Step 4: Run full build**

Run: `bun run build`

Expected: Build succeeds with zero type errors.
