# Page Layout Convention

## Context

Pages under the `(app)` route group have inconsistent header patterns. Some have breadcrumbs, some have right-aligned actions, some have descriptions, but each page assembles these ad-hoc with inline markup. The content area doesn't consistently fill remaining viewport height, which affects empty states and future scroll behavior.

This plan introduces a small set of composable layout components (`Page`, `PageHeader`, `PageContent`) to standardize every page's structure: a fixed header region (title, optional breadcrumbs, optional actions) above a content region that fills remaining height.

## New Component

**`src/components/common/page.tsx`** — three server-compatible components:

```tsx
// Breadcrumb data type
interface PageBreadcrumb {
  label: string
  href?: string  // omit href for the current (last) page
}

// Page — outer flex column that fills remaining SidebarInset height
function Page({ children, className }) {
  return (
    <div className={cn("flex flex-1 flex-col gap-group px-page py-section", className)}>
      {children}
    </div>
  )
}

// PageHeader — breadcrumbs + title row (title left, actions right) + optional description
// Breadcrumbs are data-driven: pass an array of { label, href? } objects.
// Items with href render as links; the final item (no href) renders as the current page.
function PageHeader({ title, description, actions, breadcrumbs }) {
  return (
    <header className="flex flex-col gap-group" data-slot="page-header">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={crumb.label}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-title">{title}</h1>
          {actions && <div className="flex items-center gap-element">{actions}</div>}
        </div>
        {description && (
          <p className="mt-2 text-body text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
  )
}

// PageContent — fills remaining height, hosts page body
function PageContent({ children, className }) {
  return (
    <div className={cn("flex flex-1 flex-col", className)} data-slot="page-content">
      {children}
    </div>
  )
}
```

Key design decisions:
- `Page` owns the padding (`px-page py-section`) and inter-section gap (`gap-group`) — children don't repeat padding.
- `Page` has `flex-1` so it fills the SidebarInset's remaining height (after the mobile trigger bar).
- `PageContent` has `flex-1` so it fills remaining height after the header, enabling centered empty states.
- Tab navs (ProductionTabNav, RoleTabNav) sit between PageHeader and PageContent as direct children of Page, inheriting the gap.
- Breadcrumbs are data-driven — pass `[{ label, href? }]` and `PageHeader` handles all the Breadcrumb markup internally. No need for consumers to import breadcrumb primitives.

## Files to Modify (8 total)

### 1. Create `src/components/common/page.tsx`
New file with `Page`, `PageHeader`, `PageContent` as described above.

### 2. `src/app/(app)/home/page.tsx`
Replace the outer `div.flex.flex-col.gap-group.px-page.py-section` with:
```tsx
<Page>
  <PageHeader title={`Welcome, ${user?.name}.`} />
  <PageContent>
    {/* empty state or production cards — unchanged */}
  </PageContent>
</Page>
```

### 3. `src/app/(app)/candidates/page.tsx`
Currently renders two completely different trees depending on data. Unify into one tree — the title always shows:
```tsx
<Page>
  <PageHeader title="Candidates" />
  <PageContent>
    {candidates.length === 0 ? (
      <div className="flex flex-1 items-center justify-center">
        <Empty>...</Empty>
      </div>
    ) : (
      <CandidatesTable candidates={candidates} />
    )}
  </PageContent>
</Page>
```

### 4. `src/app/(app)/productions/page.tsx`
Similarly unify the two branches. Title and action button always show:
```tsx
<Page>
  <PageHeader
    title="Productions"
    actions={<Button href="/productions/new">Create production</Button>}
  />
  <PageContent>
    {productions.length === 0 ? (
      <div className="flex flex-1 items-center justify-center">
        <Empty>...</Empty>
      </div>
    ) : (
      <div className="grid gap-block sm:grid-cols-2 lg:grid-cols-3">...</div>
    )}
  </PageContent>
</Page>
```

### 5. `src/app/(app)/productions/new/page.tsx`
```tsx
<Page>
  <PageHeader
    title="New production"
    description="Set up your production details. You can add roles now or later."
  />
  <PageContent>
    <div className="mx-auto w-full max-w-xl">
      <CreateProductionForm orgSlug={orgSlug} />
    </div>
  </PageContent>
</Page>
```

### 6. `src/app/(app)/settings/page.tsx`
```tsx
<Page>
  <PageHeader title="Settings" />
  <PageContent>
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-section">
      {/* organization profile section + separator + members section — unchanged */}
    </div>
  </PageContent>
</Page>
```
Removes the redundant `py-page` and `px-page` that were on the old wrapper (Page now handles this).

### 7. `src/app/(app)/productions/[id]/(production)/layout.tsx`
Replace the outer div + inline breadcrumbs + title markup:
```tsx
<Page>
  <PageHeader
    title={production.name}
    description={production.description}
    breadcrumbs={[
      { label: "Productions", href: "/productions" },
      { label: production.name },
    ]}
    actions={<PreviewLinkButtons url={...} href={...} />}
  />
  <ProductionTabNav productionId={production.id} />
  <PageContent>{children}</PageContent>
</Page>
```
No more importing breadcrumb primitives or `Link` in this file.

### 8. `src/app/(app)/productions/[id]/roles/[roleId]/layout.tsx`
Same pattern with the deeper breadcrumb trail:
```tsx
<Page>
  <PageHeader
    title={role.name}
    description={role.description}
    breadcrumbs={[
      { label: "Productions", href: "/productions" },
      { label: role.production.name, href: `/productions/${id}` },
      { label: role.name },
    ]}
    actions={<PreviewLinkButtons url={...} href={...} />}
  />
  <RoleTabNav productionId={id} roleId={roleId} />
  <PageContent>{children}</PageContent>
</Page>
```

## Pages That Need No Changes

Child pages under the production and role layouts (`page.tsx`, `settings/page.tsx`) render content directly — they don't manage headers. Their content flows into the layout's `{children}` inside `PageContent`, so they remain unchanged.

## Verification

1. Run `bun run build` — confirms no type errors and all pages compile
2. Run `bun run lint` — confirms Biome is happy
3. Manually check in browser:
   - `/home` — title visible, production cards or empty state fill remaining height
   - `/productions` — title + "Create production" button, cards or centered empty state
   - `/productions/new` — title + description, centered form
   - `/productions/[id]` — breadcrumbs, title + preview buttons, description, tab nav, content
   - `/productions/[id]/settings` — same header, settings content below
   - `/productions/[id]/roles/[roleId]` — deeper breadcrumbs, title, tab nav, submissions
   - `/candidates` — title, table or centered empty state
   - `/settings` — title, centered max-w-3xl content
