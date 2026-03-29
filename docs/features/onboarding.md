# Onboarding

> **Last verified:** 2026-03-29

## Overview
A multi-step flow shown to authenticated users who do not yet belong to any organization. Bridges the gap between signup and first use -- a new account is useless without an org context. If the user has pending invitations, those are shown first so they can join existing orgs without creating unnecessary ones. Otherwise the flow guides them through org creation and team invites.

## Routes
| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/onboarding` | `OnboardingFlow` (via `page.tsx`) | Authenticated, no org membership | Multi-step wizard: pending invites -> create org -> invite team -> accept remaining |

## Data Model
Onboarding does not have its own tables. It reads and writes through Better Auth's organization system.

| Table | Key Columns | Relationship |
|-------|-------------|--------------|
| `user` | `id`, `name`, `email` | The authenticated user going through onboarding |
| `member` | `userId`, `organizationId`, `role` | Checked by `hasAnyOrganization()` to determine if onboarding is needed |
| `organization` | `id`, `name`, `slug` | Created during org-creation step |
| `invitation` | `id`, `organizationId`, `email`, `role`, `status`, `expiresAt` | Read for pending-invites step; accepted/rejected via Better Auth client |

Additionally, `OrganizationProfile` is created during org creation with `isOrganizationProfileOpen: true`.

## Key Files
| File | Purpose |
|------|---------|
| `src/app/onboarding/layout.tsx` | Server component; auth guard + centered card shell with radial gradient |
| `src/app/onboarding/page.tsx` | Server component; fetches `getUserInvitations()`, renders `<OnboardingFlow>` |
| `src/components/onboarding/onboarding-flow.tsx` | Client component; owns step state machine with 4 steps |
| `src/components/onboarding/onboarding-invitation-list.tsx` | Client component; pending invitations with Accept/Ignore actions |
| `src/components/onboarding/create-org-form.tsx` | Client component; org name + slug form; `useHookFormAction` with `createOrganization` |
| `src/components/onboarding/invite-team-form.tsx` | Client component; email input to send invites one at a time |
| `src/actions/organizations/create-organization.ts` | Creates org via Better Auth API, inserts `OrganizationProfile`, sets active org |
| `src/actions/organizations/invite-member.ts` | Validates caller is owner/admin, anti-spam check, sends invite |
| `src/actions/organizations/get-user-invitations.ts` | Returns pending invitations for the current user's email |
| `src/actions/organizations/get-user-memberships.ts` | `hasAnyOrganization(userId)` |
| `src/lib/schemas/organization.ts` | Zod schemas for org creation and invite |

## How It Works

### Entry Condition
`(app)/layout.tsx` calls `hasAnyOrganization(user.id)` after confirming authentication. No memberships -> redirect to `/onboarding`.

### Step Machine

```
Initial state:
  pendingInvitations.length > 0 ? "pending-invites" : "create-org"

Transitions:
  "pending-invites"
    ├── Accept/Ignore invitations (tracked via resolvedIds Set)
    ├── "Continue" (requires >= 1 accepted) → router.push("/home")
    └── "Or create your own organization" → "create-org"

  "create-org"
    └── CreateOrgForm onComplete(orgId) → "invite-team"

  "invite-team"
    ├── Send invites (one at a time, tracked in sentEmails[])
    └── "Continue" / "Skip for now"
        ├── if unresolvedInvitations remain → "accept-remaining"
        └── else → router.push("/home")

  "accept-remaining"
    └── Accept/Ignore remaining → router.push("/home")
```

### Create Org Form
1. User enters org name. Slug auto-derives via `toUrlId()` (lowercase, hyphens, max 40 chars).
2. Slug field is editable. Manual edit stops auto-derivation (`slugManuallyEdited` ref).
3. URL preview: `{appUrl}/s/{slug}`.
4. `createOrganization` action creates org, inserts `OrganizationProfile`, sets active org on session.
5. `onComplete(orgId)` advances to invite-team step.

### Invite Team Form
1. Single email field. `inviteMember` action with `role: "member"`.
2. Anti-spam check: max 3 consecutive rejections from same email in 30 days.
3. Sent emails accumulate in visible list with checkmarks.

### Invitation List
1. Each invitation shows org name + role badge + Accept/Ignore buttons.
2. Accept: `authClient.organization.acceptInvitation` then `setActive`.
3. Ignore: `authClient.organization.rejectInvitation`.
4. Resolved invitations tracked in `Set<string>` and filtered from display.

## Business Logic

### Validation Rules
| Schema | Field | Rules |
|--------|-------|-------|
| `createOrgFormSchema` | `name` | `.trim().min(1, "Organization name is required.")` |
| `createOrgFormSchema` | `slug` | `slugSchema` (3-60 chars, lowercase alphanumeric + hyphens) |
| `inviteFormSchema` | `email` | `.trim().email()` |

### Authorization
- `createOrganization`: any authenticated user can create an org.
- `inviteMember`: requires caller to be `owner` or `admin` of the target org.

### Anti-Spam
3+ invitations to the same email in 30 days, all rejected -> blocks further invites with message.

### Edge Cases
- `getUserInvitations()` falls back to empty array on failure.
- "Continue" on pending-invites disabled until at least one accepted.
- `createOrganization` intentionally omits `revalidatePath` to prevent premature redirect.

## UI States
| State | Handling |
|-------|----------|
| No pending invitations | Skips to "create-org" step |
| Has pending invitations | "You've been invited" with invitation list |
| Invitation loading | Individual button shows "Accepting..."/"Ignoring..."; all buttons disabled |
| Invitation error | Destructive Alert at top of list |
| Org creation loading | Submit button spinner |
| Org creation error | Root-level destructive Alert |
| Invite sent | Email in list with green checkmark |
| Invite error | Root-level destructive Alert |

## Integration Points
- Entry triggered by auth guard in [(app)/layout.tsx](./app-shell.md) when `hasAnyOrganization()` returns false
- Auth state from [Auth Flow](./auth.md) via `getCurrentUser()`
- `CreateOrgForm` reused by org switcher dialog in [Organizations](./organizations.md)
- `inviteMember` action shared with [Organizations Management](./organizations.md) settings
- Completion lands at `/home` in the [App Shell](./app-shell.md)

## Architecture Decisions
- **Client-side step manager.** Step transitions are instant; no intermediate state needs URL persistence. Single component with `useState<Step>` is simpler than multi-page routing.
- **`onComplete` callback on `CreateOrgForm`.** Enables reuse in org switcher dialog without forking the component.
- **Guard in layout, not page.** Applies to all child routes under `/onboarding/`.
- **No `revalidatePath` in `createOrganization`.** Adding it caused App Router to redirect before the invite step could render.
- **Pending invitations shown first.** Joining an existing org is preferred over creating unnecessary new ones.
