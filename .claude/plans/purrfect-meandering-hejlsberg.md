# Plan: Organization Management

## Context

Users currently can only create an organization during onboarding. There's no way to create additional organizations, switch between them, or manage membership (invite members, change roles, transfer ownership). Better Auth's organization plugin already provides all the server-side APIs we need — this work is primarily about building the UI and wiring up server actions.

## Requirements

1. **Create new organization** — from the sidebar
2. **Manage current organization** — if user is owner or admin:
   - Rename the organization
   - View and manage members (table with roles)
   - Invite new members by email with a role (admin or member — not owner)
   - Promote members to admin (owner and admin can do this)
   - Transfer ownership to another member (owner only; old owner becomes admin)
   - Remove members
3. **Stubbed email invite** — no actual email sent, but the invitation record is created and the invited user gains access immediately
4. **Role rules** — one owner per org; owners/admins can promote to admin; ownership transfer is a separate action from invite

## Architecture

### Server Actions (`src/actions/organizations/`)

All use `secureActionClient` with `next-safe-action`. Leverage Better Auth's `auth.api.*` methods.

| File | Action | Auth API Used |
|------|--------|---------------|
| `create-organization.ts` | (exists) | `auth.api.createOrganization` |
| `get-organization.ts` | `getOrganization(orgId)` — reads org + members | `auth.api.getFullOrganization` |
| `get-user-organizations.ts` | `getUserOrganizations()` — list user's orgs | `auth.api.listOrganizations` |
| `update-organization.ts` | `updateOrganization({ orgId, name })` — rename | Direct DB update on `organization` table |
| `invite-member.ts` | `inviteMember({ orgId, email, role })` — create invitation + auto-accept | `auth.api.createInvitation` then immediately accept it (stub: no email) |
| `update-member-role.ts` | `updateMemberRole({ memberId, role, orgId })` — promote to admin | `auth.api.updateMemberRole` |
| `remove-member.ts` | `removeMember({ memberId, orgId })` — remove | `auth.api.removeMember` |
| `transfer-ownership.ts` | `transferOwnership({ memberId, orgId })` — owner-only | Set target member to "owner", set current owner to "admin" via DB |
| `set-active-organization.ts` | `setActiveOrganization({ orgId })` — switch org | `auth.api.setActiveOrganization` |

**Authorization approach:** Each action verifies the caller's role by querying the `member` table. Owner-only actions (transfer, remove admin) check `role === "owner"`. Admin+ actions (invite, promote, remove member) check `role === "owner" || role === "admin"`.

### Sidebar Changes (`src/components/app/app-sidebar.tsx`)

Add two items to the sidebar below the existing nav:

1. **Organization switcher section** in the sidebar header or content area — shows current org name, dropdown to switch orgs or create new
2. **"Settings" nav item** — links to `/settings` for org management (only visible to owner/admin)

The sidebar will need additional props from the layout: `organizations` (list of user's orgs), `activeOrganization` (current org with user's role).

### New Pages (`src/app/(app)/settings/`)

Single settings route with tabs:

- **`/settings` page** — Organization settings page with two tabs:
  - **General** tab — Rename organization (owner/admin only)
  - **Members** tab — Member table, invite dialog, role management, ownership transfer

### New Components (`src/components/organizations/`)

| Component | Type | Purpose |
|-----------|------|---------|
| `org-switcher.tsx` | Client | Dropdown in sidebar: lists orgs, switch active, "Create new" option |
| `create-org-dialog.tsx` | Client | Dialog to create a new organization (reuse pattern from onboarding form) |
| `org-settings-form.tsx` | Client | Form to rename organization |
| `members-table.tsx` | Client | Table of members with role badges and action buttons |
| `invite-member-dialog.tsx` | Client | Dialog: email + role select → invite |
| `change-role-dialog.tsx` | Client | Dialog to change a member's role to admin/member |
| `transfer-ownership-dialog.tsx` | Client | AlertDialog confirmation for ownership transfer |
| `remove-member-dialog.tsx` | Client | AlertDialog confirmation for member removal |

### Layout Changes (`src/app/(app)/layout.tsx`)

Fetch current user's organizations and active org data, pass to `AppSidebar`.

## Implementation Steps

### Step 1: Server Actions

Create the new server actions in `src/actions/organizations/`:
- `get-organization.ts` — get full org details with members
- `get-user-organizations.ts` — list user's orgs
- `update-organization.ts` — rename org
- `invite-member.ts` — invite + auto-accept (stub email)
- `update-member-role.ts` — change role
- `remove-member.ts` — remove member
- `transfer-ownership.ts` — transfer ownership
- `set-active-organization.ts` — switch active org

### Step 2: Sidebar Organization Switcher

- Create `src/components/organizations/org-switcher.tsx` — popover-based org switcher
- Create `src/components/organizations/create-org-dialog.tsx` — dialog for new org
- Update `src/components/app/app-sidebar.tsx` — add org switcher section and Settings nav item
- Update `src/app/(app)/layout.tsx` — fetch and pass org data to sidebar

### Step 3: Settings Page & Organization Management UI

- Create `src/app/(app)/settings/page.tsx` — settings page with General + Members tabs
- Create `src/components/organizations/org-settings-form.tsx` — rename form
- Create `src/components/organizations/members-table.tsx` — member list with actions
- Create `src/components/organizations/invite-member-dialog.tsx`
- Create `src/components/organizations/change-role-dialog.tsx`
- Create `src/components/organizations/transfer-ownership-dialog.tsx`
- Create `src/components/organizations/remove-member-dialog.tsx`

### Step 4: Verify

- `bun run build` — ensure no build errors
- `bun run lint` — ensure no lint errors

## Key Files Modified

- `src/app/(app)/layout.tsx` — add org data fetching
- `src/components/app/app-sidebar.tsx` — add org switcher + settings link

## Key Files Created

- `src/actions/organizations/` — 7 new action files
- `src/components/organizations/` — 8 new component files
- `src/app/(app)/settings/page.tsx` — settings page

## Patterns Reused

- **Form pattern**: `react-hook-form` + `zodResolver` + `next-safe-action/hooks` (from `create-org-form.tsx`, `add-user-dialog.tsx`)
- **Table pattern**: Table + Badge + ghost icon buttons (from `admin-users-client.tsx`)
- **Dialog pattern**: Dialog + form + FieldGroup (from `add-user-dialog.tsx`)
- **AlertDialog pattern**: Confirmation flow (from `delete-user-dialog.tsx`)
- **Action pattern**: `secureActionClient` with metadata + inputSchema (from `create-organization.ts`)
- **Design tokens**: `text-title`, `text-label`, `gap-section`, `gap-group`, `gap-block`, `gap-element`, `px-page`

## Verification

1. Run `bun run build` — no type or build errors
2. Run `bun run lint` — clean output
3. Manual testing:
   - Sidebar shows current org name with switcher
   - Can create a new organization from switcher
   - Can switch between organizations
   - Settings page shows General + Members tabs
   - Can rename organization
   - Can invite a member by email (auto-accepted, no email sent)
   - Member appears in table with correct role
   - Can promote member to admin
   - Can transfer ownership (old owner becomes admin)
   - Can remove a member
   - Non-admin/owner users don't see Settings link
