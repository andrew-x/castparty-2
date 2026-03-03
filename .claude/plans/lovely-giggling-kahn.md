# Entity-Specific Not Found Pages for Public Submission Routes

## Context

All three public submission routes (`/s/[orgSlug]`, `/s/[orgSlug]/[productionSlug]`, `/s/[orgSlug]/[productionSlug]/[roleSlug]`) call `notFound()` when an entity is missing, which renders the global 404 ("This page didn't make the callback list"). This is unhelpful — a candidate visiting a broken audition link has no idea if the organization, production, or role was the problem. We want entity-specific messages like "This organization can't be found or is no longer public."

## Approach

Replace `notFound()` calls with inline rendering of a shared `NotFoundEntity` component. This gives us:

- **Entity-specific copy** — the message names the missing entity type
- **Contextual navigation** — links back to the nearest valid parent (e.g., "Back to auditions" on the org page when a production is missing)
- **Preserved layout** — renders inside `/s/layout.tsx`, keeping the footer and container

### Why not `not-found.tsx` at route segments?

Next.js `not-found.tsx` boundaries can't know *which* entity was missing (the production page calls `notFound()` for both missing org and missing production). Inline rendering gives us full control.

### Trade-off: HTTP status

Pages will return 200 instead of 404 for missing entities. This is acceptable — these deep `/s/` routes with dynamic slugs aren't SEO-sensitive.

## Files

| File | Action |
|------|--------|
| `src/components/submissions/not-found-entity.tsx` | **Create** |
| `src/app/s/[orgSlug]/page.tsx` | **Modify** |
| `src/app/s/[orgSlug]/[productionSlug]/page.tsx` | **Modify** |
| `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` | **Modify** |

## Step 1: Create `NotFoundEntity` component

**`src/components/submissions/not-found-entity.tsx`** — server component, no `"use client"`.

```tsx
import { BuildingIcon, ClapperboardIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/common/button"

const config = {
  organization: { label: "Organization", icon: BuildingIcon },
  production: { label: "Production", icon: ClapperboardIcon },
  role: { label: "Role", icon: UserIcon },
}

export function NotFoundEntity({
  entity,
  backHref = "/",
  backLabel = "Back to home",
}: {
  entity: "organization" | "production" | "role"
  backHref?: string
  backLabel?: string
}) {
  const { label, icon: Icon } = config[entity]

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-group text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-6 text-foreground" />
      </div>
      <div className="flex flex-col items-center gap-element">
        <h1 className="font-serif text-foreground text-title">
          {label} not found
        </h1>
        <p className="text-muted-foreground">
          This {entity} can&apos;t be found or is no longer public.
        </p>
      </div>
      <Button href={backHref} variant="outline">
        {backLabel}
      </Button>
    </div>
  )
}
```

Uses `flex-1` to fill the available height inside the `/s/` layout, centering the message vertically. Matches the visual language of the global 404 (serif heading, muted description, outline button) but lighter-weight.

## Step 2: Update org page

**`src/app/s/[orgSlug]/page.tsx`**

- Remove `import { notFound } from "next/navigation"`
- Add `import { NotFoundEntity } from "@/components/submissions/not-found-entity"`
- Replace `if (!org) notFound()` with `if (!org) return <NotFoundEntity entity="organization" />`

## Step 3: Update production page

**`src/app/s/[orgSlug]/[productionSlug]/page.tsx`**

- Remove `notFound` import, add `NotFoundEntity` import
- `if (!org)` → `return <NotFoundEntity entity="organization" />`
- `if (!production)` → `return <NotFoundEntity entity="production" backHref={`/s/${orgSlug}`} backLabel="Back to auditions" />`

## Step 4: Update role/submission page

**`src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`**

- Remove `notFound` import, add `NotFoundEntity` import
- `if (!org)` → `return <NotFoundEntity entity="organization" />`
- `if (!production)` → `return <NotFoundEntity entity="production" backHref={`/s/${orgSlug}`} backLabel="Back to auditions" />`
- `if (!role)` → `return <NotFoundEntity entity="role" backHref={`/s/${orgSlug}/${productionSlug}`} backLabel="Back to production" />`

## Verification

1. Visit `/s/nonexistent-org` — shows "Organization not found" + "Back to home"
2. Visit `/s/valid-org/nonexistent-prod` — shows "Production not found" + "Back to auditions" linking to `/s/valid-org`
3. Visit `/s/valid-org/valid-prod/nonexistent-role` — shows "Role not found" + "Back to production" linking to `/s/valid-org/valid-prod`
4. All render within the `/s/` layout (footer visible)
5. Valid routes still work normally
6. Non-`/s/` routes still show the global 404
7. `bun run build` and `bun run lint` pass
