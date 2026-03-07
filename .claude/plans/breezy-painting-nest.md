# Plan: Add Resend Email Integration

## Context

Castparty has Better Auth configured with email/password auth, but no emails are actually sent. The forgot-password form is a stub (fake delay), organization invitations create DB records but don't notify anyone, and email verification doesn't exist. Resend SDK is installed and an API key is configured, but nothing uses them.

This plan adds real email delivery via Resend with branded React Email templates, covering three flows: password reset, email verification, and organization invitations. In development, emails are logged to the console instead of sent.

## Decisions

- **From address:** `Castparty <message@mail.joincastparty.com>` (configurable via `EMAIL_FROM` env var)
- **Email flows:** Password reset, email verification (on signup), organization invitations
- **Verification policy:** Send verification email on signup but don't block app access. Users can use the app immediately; verification is a nudge, not a gate.
- **Dev mode:** Render email HTML and log to console via existing `logger` utility

## Step 1: Install `@react-email/components`

```bash
bun add @react-email/components
```

Resend (`resend@6.9.3`) is already installed.

## Step 2: Create email send utility

**New file: `src/lib/email.ts`**

Exports `sendEmail({ to, subject, react, text })`:
- **Production:** Uses Resend SDK to send
- **Development:** Uses `render()` from `@react-email/components` to convert to HTML, logs via `logger.info()` from `@/lib/logger`
- `from` defaults to `process.env.EMAIL_FROM ?? "Castparty <message@mail.joincastparty.com>"`
- Catches errors internally and logs them (callers fire-and-forget)
- Resend client lazily instantiated to avoid import-time side effects

Reuses:
- `IS_DEV` from `@/lib/util` (line 1 check)
- `logger` from `@/lib/logger` (dev console output — note: logger only outputs in dev, which is exactly what we want)

## Step 3: Create email templates

**New directory: `src/lib/emails/`**

### 3a. Shared layout — `src/lib/emails/components/layout.tsx`

Reusable wrapper with Castparty branding:
- 600px max-width container, white background
- DM Sans font stack with web-safe fallbacks
- Violet accent (`#7c3aed`) for headings
- Orange CTA button (`#f97316`) with white text, rounded
- Footer with "Castparty" and muted disclaimer
- Clean, generous whitespace

### 3b. Password reset — `src/lib/emails/password-reset.tsx`

`PasswordResetEmail({ name, resetUrl })`
- "Reset your password" heading
- CTA: "Reset password" → `resetUrl`
- Fallback: "If you didn't request this, ignore this email."

### 3c. Email verification — `src/lib/emails/verify-email.tsx`

`VerifyEmailEmail({ name, verifyUrl })`
- "Verify your email" heading
- CTA: "Verify email" → `verifyUrl`
- Fallback: "If you didn't create an account, ignore this email."

### 3d. Organization invitation — `src/lib/emails/invitation.tsx`

`InvitationEmail({ inviterName, organizationName, acceptUrl })`
- "You're invited to {organizationName}" heading
- CTA: "Accept invitation" → `acceptUrl`
- Fallback: "If you don't want to join, ignore this email."

## Step 4: Wire up Better Auth email handlers

**Modify: `src/lib/auth.ts`**

### 4a. Password reset

Add `sendResetPassword` to the existing `emailAndPassword` block:

```ts
emailAndPassword: {
  enabled: true,
  sendResetPassword: async ({ user, url }) => {
    sendEmail({
      to: user.email,
      subject: "Reset your password",
      react: PasswordResetEmail({ name: user.name, resetUrl: url }),
      text: `Reset your password here: ${url}`,
    })
  },
},
```

### 4b. Email verification

Add a top-level `emailVerification` block:

```ts
emailVerification: {
  sendOnSignUp: true,
  autoSignInAfterVerification: true,
  sendVerificationEmail: async ({ user, url }) => {
    sendEmail({
      to: user.email,
      subject: "Verify your email",
      react: VerifyEmailEmail({ name: user.name, verifyUrl: url }),
      text: `Verify your email here: ${url}`,
    })
  },
},
```

### 4c. Organization invitations

Add `sendInvitationEmail` to the existing `organizationPlugin()`:

```ts
organizationPlugin({
  creatorRole: "owner",
  sendInvitationEmail: async (data) => {
    const acceptUrl = getAppUrl(`/accept-invitation/${data.id}`)
    sendEmail({
      to: data.email,
      subject: `You're invited to ${data.organization.name}`,
      react: InvitationEmail({
        inviterName: data.inviter.user.name,
        organizationName: data.organization.name,
        acceptUrl,
      }),
      text: `${data.inviter.user.name} invited you to ${data.organization.name}. Accept here: ${acceptUrl}`,
    })
  },
}),
```

All handlers call `sendEmail()` without `await` (fire-and-forget to prevent timing attacks).

## Step 5: Create callback pages

### 5a. Reset password page — `src/app/auth/reset-password/page.tsx`

Server component that reads `searchParams.token`:
- No token → error message ("This reset link is invalid or expired.")
- Has token → renders `<ResetPasswordForm token={token} />`

### 5b. Reset password form — `src/components/auth/reset-password-form.tsx`

Client component following the same pattern as `signup-form.tsx`:
- Fields: new password, confirm password
- Calls `authClient.resetPassword({ newPassword, token })`
- Success → shows confirmation with link to sign in
- Error → `form.setError("root", ...)`

### 5c. Reset password schema — `src/lib/schemas/auth.ts`

```ts
export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
})
```

### 5d. Email verification callback — `src/app/auth/verify-email/page.tsx`

Server component. Better Auth handles token validation via its API route (`/api/auth/verify-email?token=...`). This page is the `callbackURL` destination:
- Success → "Your email has been verified." with link to continue
- Error (from `searchParams.error`) → "This verification link is invalid or expired."

## Step 6: Update forgot-password form

**Modify: `src/components/auth/forgot-password-form.tsx`**

Replace the stub with a real call:

```ts
import { authClient } from "@/lib/auth/auth-client"

async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
  await authClient.forgetPassword({
    email: values.email,
    redirectTo: "/auth/reset-password",
  })
  setSubmitted(true)
}
```

The existing success UI is already correct and prevents account enumeration.

## Step 7: Invitation acceptance page

### 7a. Page — `src/app/accept-invitation/[id]/page.tsx`

Server component:
- Reads invitation ID from params
- Checks auth via `getSession()`
- **Authenticated:** Renders `<AcceptInvitationCard>` with invitation details
- **Not authenticated:** Redirects to `/auth?redirect=/accept-invitation/{id}`

### 7b. Accept card — `src/components/organizations/accept-invitation-card.tsx`

Client component:
- Shows org name and inviter name (passed as props from server)
- "Accept" button → `authClient.organization.acceptInvitation({ invitationId })`
- "Decline" button → `authClient.organization.rejectInvitation({ invitationId })`
- Redirects to `/home` on accept

### 7c. Signup redirect support

**Modify: `src/components/auth/signup-form.tsx`**

Add `redirect` searchParam support so post-signup redirects to the invitation page instead of always `/home`:

```ts
// Read redirect from URL searchParams
const redirect = searchParams.get("redirect") ?? "/home"
router.push(redirect)
```

## Step 8: Add `EMAIL_FROM` to env

Add to `.env`:
```
EMAIL_FROM=Castparty <message@mail.joincastparty.com>
```

## File Summary

| Action | File |
|--------|------|
| New | `src/lib/email.ts` |
| New | `src/lib/emails/components/layout.tsx` |
| New | `src/lib/emails/password-reset.tsx` |
| New | `src/lib/emails/verify-email.tsx` |
| New | `src/lib/emails/invitation.tsx` |
| New | `src/lib/schemas/auth.ts` |
| New | `src/app/auth/reset-password/page.tsx` |
| New | `src/components/auth/reset-password-form.tsx` |
| New | `src/app/auth/verify-email/page.tsx` |
| New | `src/app/accept-invitation/[id]/page.tsx` |
| New | `src/components/organizations/accept-invitation-card.tsx` |
| Modify | `src/lib/auth.ts` |
| Modify | `src/components/auth/forgot-password-form.tsx` |
| Modify | `src/components/auth/signup-form.tsx` |
| Modify | `.env` |

## Existing utilities reused

- `IS_DEV` — `src/lib/util.ts`
- `logger` — `src/lib/logger.ts`
- `getAppUrl()` — `src/lib/url.ts`
- `authClient` — `src/lib/auth/auth-client.ts`
- `getSession()` — `src/lib/auth.ts`
- Common components: `Button`, `Input`, `Alert`, `Field`, `FieldGroup`, `FieldLabel`, `FieldError`

## Implementation order

1. `bun add @react-email/components`
2. `src/lib/email.ts` (no deps)
3. `src/lib/emails/` templates (depends on package from step 1)
4. `src/lib/auth.ts` changes (depends on email.ts + templates)
5. `src/lib/schemas/auth.ts` (no deps, parallel with 2-4)
6. Callback pages + forms (depends on schemas + auth config)
7. `forgot-password-form.tsx` update
8. `signup-form.tsx` redirect support
9. `.env` update

Steps 2, 3, 5 can run in parallel. Steps 6, 7, 8 can run in parallel after step 4.

## Subagent plan

- **Subagent A:** Steps 1-4 (email infra + auth config)
- **Subagent B:** Steps 5-6 (schemas + callback pages)
- **Subagent C:** Steps 7-8 (form updates)
- Subagents B and C depend on A completing first

## Verification

After implementation, the user should:

1. **Dev mode email logging:** Run `bun dev`, sign up a new user → console should log the verification email HTML
2. **Forgot password flow:** Go to `/auth/forgot-password`, enter an email → console should log the reset email with a valid URL → click the URL → `/auth/reset-password?token=...` should render the reset form
3. **Invitation flow:** From an org settings page, invite a member → console should log the invitation email → click the accept URL → should show accept/decline card
4. **Build check:** Run `bun run build` to ensure no type errors
5. **Lint check:** Run `bun run lint` to verify formatting
