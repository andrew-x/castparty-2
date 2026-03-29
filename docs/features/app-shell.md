# App Shell

> **Last verified:** 2026-03-29

## Overview
The app shell provides the structural frame for all authenticated routes: a sticky top navigation bar, layout-level auth and org guards, and the content area. It also covers the public-facing landing page, the home dashboard, and global error/not-found pages. The top nav replaces a previous sidebar layout to give more horizontal content space for Kanban boards and wide layouts.

## Routes
| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | `page.tsx` (landing) | None | Public hero page with Castparty branding and CTA to `/auth` |
| `/home` | `(app)/home/page.tsx` | Authenticated + has org | Post-login dashboard: production cards grid with submission counts |
| `/(app)/*` | `(app)/layout.tsx` wraps all | Authenticated + has org | Auth guard + org guard + TopNav + main content area |
| `/settings` | `settings/layout.tsx` wraps all settings | Authenticated + owner/admin | Additional role guard for settings routes |
| (any unmatched) | `not-found.tsx` | None | Theatrical 404 page |
| (runtime error) | `error.tsx` | None (client component) | "Something went wrong backstage" with retry |
| (root layout error) | `global-error.tsx` | None (client component) | Same as error page but includes own `<html>/<body>` |

## Data Model
The app shell reads from Better Auth tables for auth context and org membership.

| Table | Key Columns | Read By |
|-------|-------------|---------|
| `user` | `id`, `name`, `email`, `image`, `emailVerified` | `getCurrentUser()` in layout |
| `session` | `activeOrganizationId` | `getSession()` for active org |
| `member` | `userId`, `organizationId`, `role` | `hasAnyOrganization()` for org guard |
| `organization` | `id`, `name`, `slug`, `logo` | `getUserOrganizations()` for org switcher |
| `invitation` | `email`, `status` | `getUserInvitations()` for pending-invite badge |
| `Production` | `id`, `name`, `status`, `slug` | `getProductionsWithSubmissionCounts()` for home dashboard |

## Key Files
| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout: DM Sans / DM Serif Display / DM Mono fonts, metadata, `TooltipProvider` |
| `src/app/page.tsx` | Landing page: centered hero with logo, tagline, CTA to `/auth` |
| `src/app/(app)/layout.tsx` | App layout: auth guard + org guard + data fetching + `TopNav` + `<main>` |
| `src/app/(app)/home/page.tsx` | Home dashboard: production cards grid, empty state CTA, archived toggle |
| `src/app/(app)/settings/layout.tsx` | Settings layout: owner/admin role guard, `SettingsSubNav` |
| `src/components/app/top-nav.tsx` | Client component: sticky 56px header with logo, nav links, org switcher, pending-invites, mobile drawer |
| `src/components/organizations/org-switcher.tsx` | Popover with user info, org list, switch action, create-org, log-out |
| `src/components/organizations/pending-invites-button.tsx` | Mail icon with badge count; opens `PendingInvitesDialog` |
| `src/components/organizations/pending-invites-dialog.tsx` | Dialog for accepting/rejecting pending invitations |
| `src/app/not-found.tsx` | 404: theatrical copy, "Back to home" button |
| `src/app/error.tsx` | Route error boundary: "Try again" + "Back to home" |
| `src/app/global-error.tsx` | Root error boundary: own `<html>/<body>`, imports `globals.scss` |

## How It Works

### App Layout Guard
```
(app)/layout.tsx (server component)
  1. getCurrentUser() → if null, redirect("/auth")
  2. hasAnyOrganization(user.id) → if false, redirect("/onboarding")
  3. Promise.all([getSession(), getUserOrganizations(), getUserInvitations()])
  4. Derive activeOrgId from session, find activeOrg from organizations list
  5. Render TopNav + <main>{children}</main>
```

### Top Navigation Bar
- **Desktop** (md+): Sticky 56px header. Left: logo -> `/home`. Center: Home, Productions, Candidates, Settings (owner/admin only). Right: pending-invites button + org switcher.
- **Mobile** (<md): Logo + right section. Hamburger opens `Sheet` (left, 256px) with nav items + icons. Auto-closes on route change.
- **Active link**: `pathname === href || pathname.startsWith(href + "/")`.

### Organization Switcher
1. Trigger shows user avatar (initials fallback), name, active org name.
2. Popover: org list with active checkmark, "Create organization" button, "Log out".
3. Switching calls `setActiveOrganization` then `router.refresh()`.

### Home Dashboard
1. Fetches `getProductionsWithSubmissionCounts()` in parallel with user data.
2. No productions: empty state with CTA. Has productions: responsive card grid (1/2/3 columns).
3. Archived hidden by default; "Show archived" toggle via `?showArchived=true` search param.

### Error Pages
- **404**: Castparty icon, decorative "404" in brand-light, "This page didn't make the callback list".
- **Route Error**: "Something went wrong backstage", "Try again" (calls `reset()`), "Back to home".
- **Global Error**: Same content, own `<html>/<body>` for root layout failures.

## Business Logic

### Auth Guard Chain
```
Request → Root Layout (no guard)
  ├── /                  → Landing page (no guard)
  ├── /auth/*            → Guest-only guard
  ├── /onboarding/*      → Auth guard only
  └── /(app)/*           → Auth + org guard
        └── /settings/*  → Additional owner/admin guard
```

### Navigation Items
| Label | Path | Icon | Visibility |
|-------|------|------|------------|
| Home | `/home` | `LayoutDashboardIcon` | Always |
| Productions | `/productions` | `ClapperboardIcon` | Always |
| Candidates | `/candidates` | `UsersIcon` | Always |
| Settings | `/settings` | `SettingsIcon` | Owner/admin only |

## UI States
| State | Handling |
|-------|----------|
| Not authenticated | Redirect to `/auth` |
| Authenticated, no org | Redirect to `/onboarding` |
| Authenticated, has org | TopNav + content rendered |
| No productions (home) | Empty state with CTA |
| Has archived | "Show archived" toggle appears |
| Pending invitations | Badge count on mail icon; dialog on click |
| No pending invitations | Button hidden |
| Mobile viewport | Hamburger + Sheet drawer |
| 404 | Theatrical copy |
| Runtime error | "Try again" resets boundary |

## Integration Points
- Auth guard uses `getCurrentUser()` from [Auth Flow](./auth.md)
- Org guard redirects to [Onboarding](./onboarding.md) when needed
- Org switcher reuses `CreateOrgForm` from [Onboarding](./onboarding.md)
- Home dashboard links to [Productions](./productions.md)
- Settings sub-routes connect to [Organizations](./organizations.md)

## Architecture Decisions
- **Top nav over sidebar.** Kanban boards and form builders need horizontal space. 56px vertical sacrifice beats 256px horizontal loss.
- **Server layout fetches, client component renders.** All TopNav data passed as props from server layout. No redundant client fetches.
- **Settings nav conditional on role.** Hidden for members; server-side guard as defense-in-depth.
- **Sheet for mobile nav.** shadcn `Sheet` (left). Auto-closes on route change via pathname comparison.
- **No middleware for auth.** Layout-based guards, co-located with route trees, no Edge Runtime constraints.
- **Theatrical error copy.** On-brand language for a performing arts platform.
