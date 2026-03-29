# Admin Panel

> **Last verified:** 2026-03-29

## Overview

The admin panel is a development-only internal tool for managing users and organizations, previewing outbound emails, and simulating inbound email replies. Gated behind the `IS_DEV` environment check -- in production, the entire `/admin` route tree returns a 404.

**Who it serves:** Developers working on Castparty locally who need to manage test data, impersonate users, preview email templates, and test inbound email handling.

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/admin` | `AdminUsersClient` | dev-only | User list with create, change password, delete, and impersonate |
| `/admin/organizations` | `AdminOrgsClient` | dev-only | Organization list with member/production counts and delete |
| `/admin/emails` | `AdminEmailsClient` | dev-only | In-memory email inbox for dev outbound emails |
| `/admin/emails/[id]` | `AdminEmailDetailClient` | dev-only | Single email rendered in sandboxed iframe |
| `/admin/simulate-email` | `SimulateEmailClient` | dev-only | Form to insert synthetic inbound Email row |

## Data Model

The admin panel operates on existing tables -- no new tables.

| Table | Operations | Notes |
|-------|-----------|-------|
| `user` | Read, Delete, Update (role) | Layout auto-promotes to admin role |
| `account` | Update (password hash) | `changePasswordAction` updates credential |
| `organization` | Read (with counts), Delete | Joins member + production counts |
| `Email` | Insert | Simulate inbound email |
| `Submission` | Read | Simulate email looks up submission for org ID |

**In-memory store:** `globalThis.__devEmails` -- `StoredEmail[]`, max 200, LIFO. Survives HMR.

## Key Files

| File | Purpose |
|------|---------|
| `src/app/admin/layout.tsx` | Dev gate, auto-promote to admin, nav, impersonation banner |
| `src/app/admin/page.tsx` | Users page |
| `src/app/admin/organizations/page.tsx` | Orgs page |
| `src/app/admin/emails/page.tsx` | Email inbox (force-dynamic) |
| `src/app/admin/emails/[id]/page.tsx` | Email detail |
| `src/app/admin/simulate-email/page.tsx` | Simulate inbound form |
| `src/actions/admin/get-users.ts` | List all users (dev-only) |
| `src/actions/admin/create-user.ts` | Create user via `auth.api.signUpEmail` |
| `src/actions/admin/change-password.ts` | Hash and update password |
| `src/actions/admin/delete-user.ts` | Delete user (cascades) |
| `src/actions/admin/delete-organization.ts` | Delete org (cascades) |
| `src/actions/admin/get-orphaned-orgs.ts` | Orgs with member + production counts |
| `src/actions/admin/simulate-inbound-email.ts` | Insert synthetic inbound Email row |
| `src/lib/action.ts` | `adminActionClient` (dev-only middleware) |
| `src/lib/email-dev-store.ts` | In-memory email store |
| `src/components/admin/admin-users-client.tsx` | Users table with actions |
| `src/components/admin/admin-orgs-client.tsx` | Orgs table; orphaned orgs highlighted |
| `src/components/admin/admin-emails-client.tsx` | Email inbox table |
| `src/components/admin/admin-email-detail-client.tsx` | Email in sandboxed iframe |
| `src/components/admin/add-user-dialog.tsx` | Create user dialog |
| `src/components/admin/change-password-dialog.tsx` | Change password dialog |
| `src/components/admin/delete-user-dialog.tsx` | Delete confirmation |
| `src/components/admin/delete-org-dialog.tsx` | Delete confirmation |
| `src/components/admin/impersonation-banner.tsx` | Impersonation state + stop button |
| `src/components/admin/simulate-email-client.tsx` | Simulate inbound form |

## How It Works

### Dev Gate and Auto-Promote

```
/admin/* request → AdminLayout
  ├── IS_DEV check → if false, notFound() (404)
  ├── If not impersonating AND user.role !== "admin":
  │     UPDATE user SET role = "admin" (enables impersonation API)
  └── Render nav + ImpersonationBanner (if impersonating)
```

### User Management

- **Create:** `auth.api.signUpEmail({ name, email, password })`
- **Change password:** Hash → UPDATE `account.password` WHERE credential provider
- **Delete:** DELETE FROM `user` (cascades via FK)
- **Impersonate:** `authClient.admin.impersonateUser({ userId })` → redirect `/`
- **Stop:** `authClient.admin.stopImpersonating()` → redirect `/admin`

### Organization Management

- **List:** SELECT with LEFT JOIN member count + production count subqueries
- **Orphaned orgs** (0 members): highlighted with destructive background
- **Delete:** DELETE FROM `organization` (cascades)

### Email Emulator

```
Dev email send → addEmail to globalThis.__devEmails (max 200)
/admin/emails → table of captured emails
/admin/emails/[id] → sandboxed iframe with auto-resize
```

### Simulate Inbound Email

```
Form: toEmail (reply+sub-xxx@...), fromEmail, subject, body
  → Parse submissionId from toEmail regex
  → Look up submission → org chain
  → INSERT Email { direction: "inbound", ... }
```

## Business Logic

### Security
- **Layout gate:** `IS_DEV` check → `notFound()` in production.
- **Action gate:** `adminActionClient` independently checks `IS_DEV`.
- **Server functions:** Each also checks `IS_DEV` independently.

### Auto-Promote
Layout auto-promotes to admin role for Better Auth impersonation API.

### Orphaned Detection
Orgs with 0 members highlighted. Typically from deleted test users.

## UI States

- **Users table:** Count, Add button. Rows: name, email, verified, created, actions. Can't impersonate self.
- **Orgs table:** Count. Rows: name, slug (linked), members, productions, created, delete. Orphaned = red bg.
- **Email inbox empty:** "No emails yet."
- **Email inbox populated:** Clickable subjects, recipient, relative time.
- **Email detail:** Back link, subject, metadata, sandboxed HTML preview.
- **Simulate success:** Green alert.
- **Simulate error:** Red alert.

## Integration Points

- [Email](./email.md) -- emulator captures emails; simulate creates inbound Email rows.
- [Kanban](./kanban.md) -- simulated inbound emails appear in submission activity logs.
- Better Auth admin plugin provides impersonation APIs.

## Architecture Decisions

- **Dev-only, not role-gated.** `IS_DEV` build-time constant, not user role. No production admin panel needed yet.
- **In-memory email store.** Zero-config, survives HMR, clears on restart. 200-email cap prevents bloat.
- **Sandboxed iframe.** Blocks script execution, allows link testing. Auto-resize via load event.
- **Separate `adminActionClient`.** Completely separate from `secureActionClient`. Prevents accidental exposure of admin actions.
