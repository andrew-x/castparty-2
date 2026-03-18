# Plan: Add Side Sub-Nav to Production & Role Pages

## Context

Production and role detail pages currently use horizontal tabs in the page header to navigate between sub-pages (Roles/Submissions, General, Pipeline, Submission form, Feedback form, Reject reasons). The user wants to replace these with a collapsible side navigation menu, so the layout is: full-width title section at top, then side nav + content below.

## Current Structure

Both production and role layouts follow the same pattern:
```
<Page>
  <PageHeader tabs={<ProductionTabNav />} />  ← tabs in header
  <PageContent>{children}</PageContent>
</Page>
```

**Production tabs** (`src/components/productions/production-tab-nav.tsx`):
- Roles (default), General, Pipeline, Submission form, Feedback form, Reject reasons

**Role tabs** (`src/components/productions/role-tab-nav.tsx`):
- Submissions (default), General, Pipeline, Submission form, Feedback form, Reject reasons

**Stage pages** (`/productions/[id]/roles/[roleId]/stages/[stageId]`) are outside the `(role)` layout group — they have their own standalone Page/PageHeader. No changes needed there.

## File Changes

| File | Action |
|------|--------|
| `src/components/common/sub-nav.tsx` | **Create** — reusable collapsible side nav component |
| `src/components/common/page.tsx` | Modify — add `PageBody` for side-nav + content layout |
| `src/app/(app)/productions/[id]/(production)/layout.tsx` | Modify — replace tabs with sub-nav |
| `src/app/(app)/productions/[id]/roles/[roleId]/(role)/layout.tsx` | Modify — replace tabs with sub-nav |
| `src/components/productions/production-tab-nav.tsx` | **Delete** — replaced by sub-nav |
| `src/components/productions/role-tab-nav.tsx` | **Delete** — replaced by sub-nav |

## Step 1: Create SubNav Component

**New file:** `src/components/common/sub-nav.tsx` (client component — needs `usePathname`)

A lightweight vertical nav that collapses to icon-only mode. No cookies or context — just `useState`.

```
Props:
  items: { label: string; href: string; icon: LucideIcon }[]

Expanded state (default):
  <aside> w-48, border-r border-border, shrink-0, pt-group, px-2
    <nav> flex flex-col gap-tight
      {items.map → <Link> with icon + label}
    </nav>
    <button> collapse toggle at bottom (PanelLeftCloseIcon)
  </aside>

Collapsed state:
  <aside> w-12, border-r border-border, shrink-0, pt-group, px-1
    <nav> flex flex-col gap-tight items-center
      {items.map → <Link> icon-only with tooltip}
    </nav>
    <button> expand toggle (PanelLeftOpenIcon)
  </aside>
```

**Transition:** `transition-all duration-200` on the aside for smooth width change.

**Link styling:**
- Expanded active: `bg-accent text-foreground font-medium rounded-md px-3 py-1.5`
- Expanded inactive: `text-muted-foreground hover:bg-accent rounded-md px-3 py-1.5`
- Collapsed: `size-8 rounded-md flex items-center justify-center` with `Tooltip` wrapping each link

**Icons per nav item:**

| Label | Icon (from lucide-react) |
|-------|--------------------------|
| Roles / Submissions | `UsersIcon` |
| General | `SettingsIcon` |
| Pipeline | `WorkflowIcon` |
| Submission form | `ClipboardListIcon` |
| Feedback form | `MessageSquareTextIcon` |
| Reject reasons | `XCircleIcon` |

**Mobile (<md):** Sub-nav starts collapsed (icon-only) to save space. Can expand via toggle. On very small screens, hidden entirely with a Sheet-based fallback.

## Step 2: Add PageBody to Page Component

**File:** `src/components/common/page.tsx`

Add a new `PageBody` component that creates the side-nav + content layout:

```tsx
function PageBody({
  children,
  nav,
  className,
}: {
  children: React.ReactNode
  nav?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-1 min-h-0", className)}>
      {nav}
      <div className="flex flex-1 flex-col overflow-auto">{children}</div>
    </div>
  )
}
```

This sits between `PageHeader` and the content, providing the horizontal split.

## Step 3: Update Production Layout

**File:** `src/app/(app)/productions/[id]/(production)/layout.tsx`

Before:
```tsx
<Page>
  <PageHeader tabs={<ProductionTabNav productionId={production.id} />} ... />
  <PageContent>{children}</PageContent>
</Page>
```

After:
```tsx
<Page>
  <PageHeader ... />   {/* no tabs prop */}
  <PageBody nav={<SubNav items={productionNavItems} />}>
    <PageContent>{children}</PageContent>
  </PageBody>
</Page>
```

Nav items:
```ts
const items = [
  { label: "Roles", href: `/productions/${id}` },
  { label: "General", href: `/productions/${id}/settings` },
  { label: "Pipeline", href: `/productions/${id}/settings/pipeline` },
  { label: "Submission form", href: `/productions/${id}/settings/submission-form` },
  { label: "Feedback form", href: `/productions/${id}/settings/feedback-form` },
  { label: "Reject reasons", href: `/productions/${id}/settings/reject-reasons` },
]
```

## Step 4: Update Role Layout

**File:** `src/app/(app)/productions/[id]/roles/[roleId]/(role)/layout.tsx`

Same pattern as Step 3, with role-specific nav items:
```ts
const items = [
  { label: "Submissions", href: `/productions/${id}/roles/${roleId}` },
  { label: "General", href: `/productions/${id}/roles/${roleId}/settings` },
  { label: "Pipeline", href: `/productions/${id}/roles/${roleId}/settings/pipeline` },
  // ... same settings sub-pages
]
```

Note: The role page's `PageContent` currently has `className="min-h-0 overflow-hidden"` for the kanban board — this must be preserved.

## Step 5: Delete Old Tab Nav Components

- Delete `src/components/productions/production-tab-nav.tsx`
- Delete `src/components/productions/role-tab-nav.tsx`

## Styling Notes

- **Expanded width:** `w-48` (192px) — compact but readable
- **Collapsed width:** `w-12` (48px) — icon-only with padding
- **Border:** `border-r border-border` right edge separator
- **Active link:** `bg-accent text-foreground font-medium rounded-md`
- **Inactive link:** `text-muted-foreground hover:bg-accent hover:text-accent-foreground`
- **Link sizing:** `text-[13.5px] px-3 py-1.5` (expanded), `size-8` icon button (collapsed)
- **Collapse transition:** `transition-[width] duration-200` on aside
- **Toggle button:** Ghost icon button at bottom of nav, `PanelLeftCloseIcon` / `PanelLeftOpenIcon`
- **Tooltips:** Wrap collapsed icon links with `<Tooltip>` showing the label
- **Mobile (<md):** Starts collapsed. Very small screens hide entirely behind toggle

## Verification

1. `bun run build` — no errors
2. `bun run lint` — no Biome violations
3. Manual checks:
   - `/productions/[id]` — full-width header, side nav visible with Roles highlighted, content on the right
   - Click through all 6 nav items on production page — content updates, active state follows
   - `/productions/[id]/roles/[roleId]` — same pattern, Submissions tab active, kanban board fills available space
   - Collapse toggle works — nav hides, content expands to full width
   - Mobile — nav hidden by default, toggle reveals it
   - Stage page (`/stages/[stageId]`) still works independently with its own header (no side nav)
