# Refactor Auth Forms: react-hook-form + Zod

## Context

The three auth forms (login, signup, forgot-password) currently use native `FormData` extraction with manual `useState` for loading and error state. The project already has `react-hook-form@^7.71.2`, `@hookform/resolvers@^5.2.2`, and `zod@^4.3.6` installed. This refactor wires the forms to react-hook-form + Zod schemas using the shadcn Controller + Field pattern, adding client-side validation and replacing manual state management.

## Files to modify (3 files, no new files)

| File | Change |
|------|--------|
| `src/components/auth/login-form.tsx` | Replace FormData + useState with useForm + Controller + Zod schema |
| `src/components/auth/signup-form.tsx` | Same refactor, three fields, different error codes |
| `src/components/auth/forgot-password-form.tsx` | Same refactor, keep `submitted` useState for render branching |

No changes to `field.tsx`, `input.tsx`, `button.tsx`, or any other files.

## Pattern (from shadcn docs)

Each field follows this structure inside a `<form onSubmit={form.handleSubmit(onSubmit)}>`:

```tsx
<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
      <Input
        {...field}
        id={field.name}
        type="email"
        autoComplete="email"
        aria-invalid={fieldState.invalid}
      />
      {fieldState.error && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Key details:
- `data-invalid={fieldState.invalid || undefined}` — avoids rendering `data-invalid="false"` as a string attribute
- `aria-invalid={fieldState.invalid}` — triggers Input's destructive border styling
- `FieldError errors` prop accepts `Array<{ message?: string }>` — compatible with RHF's error shape
- No `required` attribute on inputs — Zod handles it with custom messages

## Zod schemas

```ts
// login-form.tsx
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
})

// signup-form.tsx
const signUpSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

// forgot-password-form.tsx
const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
})
```

- Login password uses `min(1)` (non-empty only) — login should not reveal password policy
- Signup password uses `min(8)` — matches Better Auth's default, prevents unnecessary round-trip

## Server error handling

Server errors (from `authClient.signIn.email()` etc.) use `form.setError("root", { message })`:

```tsx
async function onSubmit(values: z.infer<typeof loginSchema>) {
  const { error: authError } = await authClient.signIn.email({
    email: values.email,
    password: values.password,
  })

  if (authError) {
    form.setError("root", {
      message:
        errorMessages[authError.code ?? ""] ??
        authError.message ??
        "Something went wrong. Try again.",
    })
    return
  }

  router.push("/home")
}
```

Root errors display outside Controllers, before the submit button:
```tsx
{form.formState.errors.root && (
  <FieldError>{form.formState.errors.root.message}</FieldError>
)}
```

Root errors persist until the next submission — standard for "wrong credentials" style errors.

## State changes

| Before | After |
|--------|-------|
| `useState(isPending)` | `form.formState.isSubmitting` |
| `useState(error)` | `form.formState.errors.root?.message` |
| `FormData` extraction | `onSubmit(values)` receives typed data |
| `e.preventDefault()` | Handled by `form.handleSubmit()` |

Exception: `forgot-password-form.tsx` keeps `useState(submitted)` for render branching (form → Alert swap).

## Implementation order

1. **Login form** — most representative (two fields, server errors, FieldDescription link)
2. **Signup form** — three fields, different error codes
3. **Forgot password form** — simplest schema, has submitted-state wrinkle

All three are independent — can be done in parallel with subagents.

## Imports for each form

```ts
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
```

## Agents used during implementation

| Agent/Skill | Purpose |
|-------------|---------|
| **subagent-driven-development** | Execute the three form refactors (potentially in parallel) |
| **verification-before-completion** | Run `bun run build` + `bun run lint` to verify |

## Verification

1. `bun run build` — no type errors
2. `bun run lint` — no Biome violations
3. Manual checks (tell user what to verify):
   - Submit each form with empty fields → Zod validation messages appear per-field
   - Submit login with wrong credentials → root error "That email and password don't match"
   - Submit signup with existing email → root error about existing account
   - Forgot password submits and shows Alert
   - "Forgot your password?" link still renders correctly inside password Controller
   - `aria-invalid` triggers destructive input border styling on invalid fields
