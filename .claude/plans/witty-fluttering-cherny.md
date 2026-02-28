# Plan: App Section Sidebar Layout

## Context

The `(app)` route group currently renders children with no UI chrome — just an auth guard. We need a persistent sidebar layout so all authenticated pages share common navigation. The shadcn `Sidebar` component (`src/components/common/sidebar.tsx`) is already installed with full state management, cookie persistence, mobile responsiveness (Sheet drawer), and keyboard shortcut (Cmd+B).

## Files to Create

### 1. `src/components/app/app-sidebar.tsx` (client component)

Dedicated sidebar component receiving user data as props. Uses `collapsible="icon"` mode (48px icon-only when collapsed, 256px when expanded).

**Structure:**
- **Header** — Castparty icon (`/icon.svg`) + app name, linked to `/home`
- **Content** — Navigation menu with three items:
  - Home (`LayoutDashboard` icon) → `/home`
  - Productions (`Clapperboard` icon) → `/productions`
  - Performers (`Users` icon) → `/performers`
- **Footer** — User avatar (initials fallback) + name + email
- **Rail** — `SidebarRail` for drag-to-collapse affordance

Active state via `usePathname()` — matches exact path or nested routes (`pathname.startsWith(href + "/")`). Tooltip on each `SidebarMenuButton` shows label when collapsed.

**Reuses:** `Sidebar*` components from `@/components/common/sidebar`, `Avatar`/`AvatarFallback` from `@/components/common/avatar`, `lucide-react` icons, `next/link`, `next/image`.

### 2. `src/components/app/app-header.tsx` (client component)

Thin header bar inside the main content area with `SidebarTrigger` button and a vertical `Separator`. Provides mobile toggle and desktop collapse affordance. Breadcrumbs can slot in later.

**Reuses:** `SidebarTrigger` from `@/components/common/sidebar`, `Separator` from `@/components/common/separator`.

## Files to Modify

### 3. `src/app/(app)/layout.tsx`

Wrap children with the sidebar layout while keeping the auth guard:

- Read `sidebar_state` cookie server-side → pass as `defaultOpen` to `SidebarProvider` (avoids flash)
- Render: `SidebarProvider` > `AppSidebar` + `SidebarInset` > `AppHeader` + `{children}`
- Pass serializable `{ name, email, image }` user object to `AppSidebar`
- Layout stays async server component — Next.js handles the client component boundary

### 4. `src/app/(app)/home/page.tsx`

- Change `<main>` to `<div>` (`SidebarInset` already renders `<main>`)
- Replace `min-h-svh` with `flex-1` (sidebar layout handles viewport height)

## Not Included (fast follows)

- **DropdownMenu on user footer** (sign out, settings) — `dropdown-menu` shadcn component not installed yet. Ship static footer first; add dropdown as a follow-up.
- **Breadcrumbs** in header — only one page exists; add when more routes land.

## Implementation Sequence

1. Create `src/components/app/app-sidebar.tsx`
2. Create `src/components/app/app-header.tsx`
3. Modify `src/app/(app)/layout.tsx`
4. Modify `src/app/(app)/home/page.tsx`

## Subagents

- **frontend-design** — invoked for the component implementation (UI work)
- **dev-docs** — verify shadcn sidebar `asChild` + `Link` pattern
- **verification-before-completion** — `bun run lint` + `bun run build`
- **Code Reviewer** agent — post-implementation review (4 files, new component pattern)
- **Librarian** — update `docs/FEATURES.md` with sidebar entry

## Verification

1. `bun run lint` — no Biome errors
2. `bun run build` — clean production build
3. Manual check: visit `/home` — sidebar visible, collapsible, user info in footer, active state on Home item
