# Settings Side Nav + SubNav Top Padding

## Context

The main settings page is a single monolithic page with Organization Profile, Members, and Account sections stacked vertically. The production settings already has a side nav pattern (`SubNav` + `PageBody`). We're bringing the same pattern to the main settings page, splitting the three sections into their own sub-pages with a side nav.

Additionally, the `SubNav` component's nav items start immediately below the toggle button's bottom border with no breathing room — we'll add a small top padding.

## Changes

### 1. Add top padding to SubNav (`src/components/common/sub-nav.tsx`)

Add `pt-2` to the `<nav>` element className (line 60). This adds 8px of padding between the collapse toggle border and the first nav item. Applies globally to all SubNav usages.

### 2. Create SettingsSubNav (`src/components/settings/settings-sub-nav.tsx` — NEW)

Client component wrapping `SubNav` with three items:
- Organization → `/settings` (Building2Icon)
- Members → `/settings/members` (UsersIcon)
- Account → `/settings/account` (UserCircleIcon)

No props needed — all paths are static. Follows the `ProductionSubNav` pattern exactly.

### 3. Create settings layout (`src/app/(app)/settings/layout.tsx` — NEW)

Follows the production layout pattern: `Page > PageHeader(title="Settings") > PageBody(nav=<SettingsSubNav>) > PageContent > {children}`

Moves auth/role guards here from the current page:
- `getCurrentUser()` → redirect `/auth`
- `getSession()` → redirect `/home` if no `activeOrgId`
- `getMemberRole()` → redirect `/home` if not owner/admin

### 4. Simplify settings page (`src/app/(app)/settings/page.tsx` — MODIFY)

Strip down to Organization Profile only:
- Remove auth checks (now in layout)
- Remove Members and Account sections
- Remove email verification banner
- Keep only: `getSession()` for `activeOrgId`, `getOrganization()`, `getOrganizationProfile()`, render `OrgSettingsForm`

### 5. Create members page (`src/app/(app)/settings/members/page.tsx` — NEW)

Extract Members section from old page:
- Fetch: `getSession()`, `getCurrentUser()`, `getOrganization()`, `getOrgInvitations()`
- Render: section heading + `MembersTable`

### 6. Create account page (`src/app/(app)/settings/account/page.tsx` — NEW)

Extract Account section + email verification banner:
- Fetch: `getCurrentUser()`
- Render: `EmailVerificationBanner` (conditional) + section heading + `AccountSettings`

## Data fetching notes

`getSession` and `getCurrentUser` both use React `cache()` (`src/lib/auth.ts:95,101`), so calls shared between layout and sub-pages are deduplicated within a single request.

## Verification

- Visit `/settings` — should show side nav with Organization selected, org profile form displayed
- Visit `/settings/members` — side nav highlights Members, members table displayed
- Visit `/settings/account` — side nav highlights Account, email verification banner (if unverified) + account settings displayed
- SubNav collapse toggle should work, all links navigate correctly
- Production settings side nav should have slightly more top padding on nav items
- Run `bun run build` to catch any type errors
