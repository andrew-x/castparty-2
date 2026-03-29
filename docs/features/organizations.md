# Organizations

> **Last verified:** 2026-03-29

## Overview

Organizations are the top-level tenant in Castparty. Every production, candidate, pipeline, and submission belongs to exactly one organization. The feature covers org CRUD, public profile management, team member lifecycle (invite/role-change/remove/ownership-transfer), an invitation acceptance flow, and a runtime org switcher so users who belong to multiple orgs can move between them.

**Who it serves:** Casting directors (org owners/admins) who set up and manage the workspace; team members who are invited to collaborate.

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/settings` | `OrgSettingsForm` | owner/admin | Edit org name, slug, description, website, public visibility |
| `/settings/members` | `MembersTable` | owner/admin | View members, invite, change roles, remove, cancel invitations |
| `/settings/account` | `AccountSettings` | any authed | User-level account settings |
| `/accept-invitation/[id]` | `AcceptInvitationCard` | authed (redirects to auth if not) | Accept or decline a specific invitation |

## Data Model

### `organization` (Better Auth managed)

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `name` | text | Required |
| `slug` | text | Unique, URL-friendly |
| `logo` | text | Nullable, not yet used |
| `createdAt` | timestamp | |

### `organization_profile` (Castparty extension)

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | FK -> `organization.id`, 1:1 |
| `websiteUrl` | text | Defaults to `""` |
| `description` | text | Max 500 chars, defaults to `""` |
| `isOrganizationProfileOpen` | boolean | Controls public audition page visibility |
| `createdAt` / `updatedAt` | timestamp | |

### `member` (Better Auth managed)

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `organizationId` | text FK | |
| `userId` | text FK | |
| `role` | text | `"owner"`, `"admin"`, or `"member"` |
| `createdAt` | timestamp | |

### `invitation` (Better Auth managed)

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `organizationId` | text FK | |
| `email` | text | Invitee email |
| `role` | text | Role to assign on accept |
| `status` | text | `"pending"`, `"accepted"`, `"rejected"`, `"cancelled"` |
| `expiresAt` | timestamp | |
| `inviterId` | text FK | |

### `session.activeOrganizationId`

The `session` table stores the currently active org. Set via `auth.api.setActiveOrganization`.

## Key Files

| File | Purpose |
|------|---------|
| `src/actions/organizations/create-organization.ts` | Create org + OrganizationProfile + set active |
| `src/actions/organizations/update-organization.ts` | Update org name/slug + profile (parallel writes) |
| `src/actions/organizations/update-organization-profile.ts` | Standalone profile update (upsert) |
| `src/actions/organizations/get-organization.ts` | Fetch org with members list + current user role |
| `src/actions/organizations/get-organization-profile.ts` | Fetch profile, auto-create if missing |
| `src/actions/organizations/invite-member.ts` | Send invitation with anti-spam guard |
| `src/actions/organizations/remove-member.ts` | Remove a member (not owner, not self) |
| `src/actions/organizations/update-member-role.ts` | Change member to admin/member |
| `src/actions/organizations/transfer-ownership.ts` | Transfer ownership with manual rollback |
| `src/actions/organizations/cancel-invitation.ts` | Cancel a pending invitation |
| `src/actions/organizations/set-active-organization.ts` | Switch active org in session |
| `src/actions/organizations/get-user-organizations.ts` | All orgs the current user belongs to |
| `src/actions/organizations/get-user-invitations.ts` | Pending invitations for current user |
| `src/actions/organizations/get-org-invitations.ts` | Pending invitations for an org |
| `src/actions/organizations/get-member-role.ts` | Look up a user's role in an org |
| `src/actions/organizations/get-active-org-slug.ts` | Get slug of current active org |
| `src/actions/organizations/get-user-memberships.ts` | Check if user has any org membership |
| `src/components/organizations/org-switcher.tsx` | Popover: switch orgs, create new, log out |
| `src/components/organizations/org-settings-form.tsx` | Settings form |
| `src/components/organizations/members-table.tsx` | Members + pending invitations tables |
| `src/components/organizations/invite-member-dialog.tsx` | Dialog: email + role select |
| `src/components/organizations/change-role-dialog.tsx` | Dialog: role select with ownership transfer |
| `src/components/organizations/remove-member-dialog.tsx` | Confirmation dialog |
| `src/components/organizations/cancel-invitation-dialog.tsx` | Confirmation dialog |
| `src/components/organizations/transfer-ownership-dialog.tsx` | Transfer confirmation |
| `src/components/organizations/accept-invitation-card.tsx` | Accept/decline card |
| `src/components/organizations/create-org-dialog.tsx` | Create org from org switcher |
| `src/components/organizations/pending-invites-button.tsx` | Nav badge with invite count |
| `src/components/organizations/pending-invites-dialog.tsx` | Dialog listing pending invitations |

## How It Works

### Organization Creation

```
User (org switcher or onboarding)
  → createOrganization action
    ├── auth.api.createOrganization (creates org + owner member)
    ├── INSERT OrganizationProfile (isOrganizationProfileOpen = true)
    └── auth.api.setActiveOrganization
```

### Organization Switching

```
OrgSwitcher → user clicks org
  → setActiveOrganization action
    ├── Verify membership
    ├── auth.api.setActiveOrganization
    └── revalidatePath("/", "layout")
  → router.refresh()
```

### Invitation Flow

```
Owner/Admin → InviteMemberDialog
  → inviteMember action
    ├── Verify caller is owner/admin
    ├── Anti-spam: check last 3 invites in 30 days
    └── auth.api.createInvitation (sends email)
  → Recipient clicks link → /accept-invitation/[id]
    ├── If not logged in: redirect to /auth?tab=signup&redirect=...
    └── AcceptInvitationCard: accept → redirect /home
```

## Business Logic

### Authorization Matrix

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View settings | Yes | Yes | No (redirected) |
| Edit org | Yes | Yes | No |
| Invite members | Yes | Yes | No |
| Change role (member→admin) | Yes | Yes | No |
| Change role (admin→member) | Yes | No | No |
| Remove member | Yes | Yes (members only) | No |
| Remove admin | Yes | No | No |
| Transfer ownership | Yes | No | No |
| Cancel invitation | Yes | Yes | No |

### Key Rules
- **Cannot remove owner:** Must transfer ownership first.
- **Cannot remove self:** Explicit check prevents accidental self-removal.
- **Anti-spam:** 3+ rejected invitations to the same email in 30 days blocks further invites.
- **Ownership transfer:** Demotes caller to admin first, promotes target. If promotion fails, rollback restores caller as owner.
- **Profile lazy creation:** `getOrganizationProfile` auto-creates a default profile if none exists.

## UI States

- **Org switcher:** Org list with checkmark on active; "Create organization" + "Log out" at bottom.
- **Settings:** Guarded at layout level -- non-owner/admin redirected to `/home`.
- **Members table:** Count, invite button (owner/admin), role badges, action buttons per permission.
- **Error states:** Root errors via Alert components; anti-spam returns descriptive message.

## Integration Points

- **Better Auth organization plugin:** Core org/member/invitation CRUD.
- [Submissions](./submissions.md) -- `isOrganizationProfileOpen` controls public casting page visibility.
- [App Shell](./app-shell.md) -- OrgSwitcher and PendingInvitesButton live in the top nav.
- All scoped features filter by `session.activeOrganizationId`.

## Architecture Decisions

- **Better Auth as org backbone.** Delegates CRUD to Better Auth's org plugin. Castparty adds `OrganizationProfile` as 1:1 extension for fields Better Auth doesn't support.
- **Parallel writes on update.** `updateOrganization` writes to `organization` and `OrganizationProfile` in `Promise.all` (independent tables).
- **Manual ownership transfer rollback.** Two-step update with try/catch rather than transaction. Recoverable failure mode.
- **Settings layout as permission gate.** Layout checks role and redirects, rather than each page checking individually.
