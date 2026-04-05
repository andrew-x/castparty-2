# Auth Flow

> **Last verified:** 2026-04-05

## Overview
Email/password authentication for production team members. Covers sign-in, account creation, email verification, password reset, and a settings-page account panel. Built on Better Auth's `signIn.email` and `signUp.email` methods. This is the mandatory entry point before any production data is accessible -- every other feature in the app lives behind an auth gate.

## Routes
| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/auth` | `AuthTabs` (via `(guest)/page.tsx`) | Guest-only (redirects to `/home` if signed in) | Tabbed login/signup form |
| `/auth?tab=signup` | Same | Guest-only | Deep link to the signup tab |
| `/auth/forgot-password` | `ForgotPasswordForm` (via `(guest)/forgot-password/page.tsx`) | Guest-only | Request a password-reset email |
| `/auth/verify-email?token=...` | `verify-email/page.tsx` | None (standalone) | Verifies email token server-side, shows success or failure |
| `/auth/reset-password?token=...` | `ResetPasswordForm` (via `reset-password/page.tsx`) | None (standalone) | Set a new password using the reset token |
| `/settings/account` | `AccountSettings` + `EmailVerificationBanner` | Authenticated (owner/admin) | Manage email display, trigger password reset, resend verification email |

## Data Model
All tables are managed by Better Auth. Castparty defines them in Drizzle schema for query/migration purposes.

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `user` | `id`, `name`, `email`, `emailVerified`, `image`, `role`, `banned` | Core user identity |
| `session` | `id`, `token`, `userId`, `expiresAt`, `activeOrganizationId` | Server-side sessions; `activeOrganizationId` tracks multi-org context |
| `account` | `id`, `userId`, `providerId`, `password` | Credential store (email/password provider) |
| `verification` | `id`, `identifier`, `value`, `expiresAt` | Email verification and password-reset tokens |

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Better Auth server config: email/password, email verification, password reset email sending, session hooks, org plugin |
| `src/lib/auth/auth-client.ts` | Client-side `createAuthClient` with `adminClient` and `organizationClient` plugins |
| `src/lib/auth/auth-util.ts` | `checkAuth()` -- server action guard: validates session, resolves `activeOrganizationId` |
| `src/lib/auth/auth-types.ts` | `OrgRole` type and `OrgRoleValues` const |
| `src/lib/schemas/auth.ts` | Zod schemas: `signUpSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema` |
| `src/app/auth/layout.tsx` | Outer auth layout: centered page with radial gradient background |
| `src/app/auth/(guest)/layout.tsx` | Guest-only guard: `getCurrentUser()` -> redirect `/home` if signed in; renders `AuthCard` shell |
| `src/app/auth/(guest)/page.tsx` | Server component: reads `?tab` search param, renders `AuthTabs` |
| `src/app/auth/(guest)/forgot-password/page.tsx` | Server component: heading + `ForgotPasswordForm` + back link |
| `src/app/auth/verify-email/page.tsx` | Server component: calls `auth.api.verifyEmail`, renders success or failure |
| `src/app/auth/reset-password/page.tsx` | Server component: reads `?token`, renders `ResetPasswordForm` or invalid-link message |
| `src/components/auth/auth-card.tsx` | Presentational wrapper: Castparty icon + bordered card (max-w-sm) |
| `src/components/auth/auth-tabs.tsx` | Client component: shadcn `Tabs` with "Sign in" / "Sign up" tabs |
| `src/components/auth/login-form.tsx` | Client component: email + password fields; calls `authClient.signIn.email` |
| `src/components/auth/signup-form.tsx` | Client component: firstName + lastName + email + password fields; calls `authClient.signUp.email` |
| `src/components/auth/forgot-password-form.tsx` | Client component: email field; calls `authClient.requestPasswordReset` |
| `src/components/auth/reset-password-form.tsx` | Client component: new password field; calls `authClient.resetPassword` |
| `src/components/auth/email-verification-banner.tsx` | Client component: alert banner with "Resend verification email" button |
| `src/components/auth/account-settings.tsx` | Client component: email display + password reset trigger |

## How It Works

### Login
1. User visits `/auth`. Guest guard redirects to `/home` if already signed in.
2. `LoginForm` collects email + password, validates via `loginSchema`.
3. Calls `authClient.signIn.email({ email, password })`.
4. On success: `router.push("/home")`. On error: maps error codes to friendly messages.

### Signup
1. "Sign up" tab. `SignUpForm` collects firstName + lastName + email + password, validates via `signUpSchema`.
2. Calls `authClient.signUp.email({ name: firstName + " " + lastName, firstName, lastName, email, password, callbackURL: "/auth/verify-email" })`.
3. Better Auth creates user + account + session. Verification email is sent automatically (`sendOnSignUp: true`).
4. On success: `router.push(redirectTo)` (defaults to `/home`, supports `?redirect` param).

### Email Verification
1. User clicks link in verification email -> `/auth/verify-email?token=...`.
2. Server component calls `auth.api.verifyEmail({ query: { token } })`.
3. Success: "Email verified" with continue button. Failure: error with link to `/auth`.
4. `autoSignInAfterVerification: true` gives the user a session on verification.

### Forgot Password
1. `/auth/forgot-password`. Collects email, calls `authClient.requestPasswordReset`.
2. Always shows: "If an account exists for that email, we sent a reset link." (non-revealing).
3. Server sends `PasswordResetEmail` with tokenized URL.

### Password Reset
1. `/auth/reset-password?token=...`. No token -> "Invalid reset link".
2. New-password field with show/hide toggle. Calls `authClient.resetPassword({ newPassword, token })`.
3. Success: "Your password has been reset" with sign-in link.

## Business Logic

### Validation Rules
| Schema | Field | Rules |
|--------|-------|-------|
| `signUpSchema` | `firstName` | `.trim().min(1, "First name is required.")` |
| `signUpSchema` | `lastName` | `.trim().min(1, "Last name is required.")` |
| `signUpSchema` | `email` | `.trim().email()` |
| `signUpSchema` | `password` | `.min(8)` (no trim -- intentional) |
| `loginSchema` | `email` | `.trim().email()` |
| `loginSchema` | `password` | `.min(1)` (no trim) |
| `forgotPasswordSchema` | `email` | `.trim().email()` |
| `resetPasswordSchema` | `password` | `.min(8)` (no trim) |

### Error Handling
- Login maps `INVALID_EMAIL_OR_PASSWORD` to a friendly message. Unknown errors fall back to generic.
- Signup maps `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`, `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`.
- Forgot password is non-revealing: always shows success.

### Route Guards
- **Guest-only** (`auth/(guest)/layout.tsx`): redirects to `/home` if signed in.
- **Auth guard** (`(app)/layout.tsx`): redirects to `/auth` if not signed in.
- **Settings guard** (`settings/layout.tsx`): only `owner` or `admin` can access.

## UI States
| State | Handling |
|-------|----------|
| Form loading | Spinner on submit button |
| Validation error | Per-field `FieldError` below each input |
| Server error | Destructive `Alert` below form fields |
| Login success | Navigate to `/home` |
| Signup success | Navigate to redirect target |
| Forgot password success | Replace form with success Alert |
| Reset password success | Replace form with success + sign-in link |
| Verification success | "Email verified" card with continue button |
| Verification failure | Error card with sign-in link |
| Invalid reset token | "Invalid reset link" with request-new-link |
| Unverified email banner | Alert on account settings with resend button |

## Integration Points
- All `(app)/*` routes depend on the auth guard in [(app)/layout.tsx](./app-shell.md)
- Post-auth, users with no org are redirected to [Onboarding](./onboarding.md)
- `getCurrentUser()` and `getSession()` used throughout the app for user context
- `checkAuth()` is the server-action-level guard used by all secure actions
- Email sending uses `src/lib/email.ts` with React email templates in `src/lib/emails/`

## Architecture Decisions
- **Layout-based guards, no middleware.** Auth checks in layout files, not `middleware.ts`. Avoids Edge Runtime constraints.
- **`router.push('/home')` instead of `callbackUrl`.** Avoids open-redirect risks.
- **Server components for pages, client components for forms.** Pages handle server data; forms manage local state and call Better Auth client SDK.
- **Non-revealing forgot-password.** Shows success unconditionally to prevent account enumeration.
- **Two layout levels for auth routes.** Outer provides styling; inner `(guest)` group handles guard and `AuthCard` shell. `verify-email` and `reset-password` sit outside `(guest)` because they need to work regardless of auth state.
- **Session hooks auto-set active org.** `databaseHooks.session.create.before` assigns first org membership as `activeOrganizationId`.
