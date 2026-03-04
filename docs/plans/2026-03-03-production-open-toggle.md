# Production Open/Closed Toggle — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a master switch to production settings that controls whether the production accepts submissions. When closed, public pages show "not found" and the share link is dimmed.

**Architecture:** A new `toggleProductionOpen` server action handles the toggle as an instant mutation (no form submission). The settings page passes `isOpen` to the form component, which renders a Switch at the top. Both public page routes check `production.isOpen` before rendering.

**Tech Stack:** next-safe-action, Drizzle ORM, Radix Switch (via `@/components/common/switch`), React Hook Form (existing)

---

### Task 1: Create `toggleProductionOpen` server action

**Files:**
- Create: `src/actions/productions/toggle-production-open.ts`

**Step 1: Create the action file**

```ts
"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"

export const toggleProductionOpen = secureActionClient
  .metadata({ action: "toggle-production-open" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      isOpen: z.boolean(),
    }),
  )
  .action(
    async ({ parsedInput: { productionId, isOpen }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true },
      })
      if (!production) throw new Error("Production not found.")

      await db
        .update(Production)
        .set({ isOpen })
        .where(eq(Production.id, productionId))

      return { success: true }
    },
  )
```

**Step 2: Verify no lint errors**

Run: `bun run lint`
Expected: No errors related to the new file.

---

### Task 2: Add the toggle to `ProductionSettingsForm`

**Files:**
- Modify: `src/components/productions/production-settings-form.tsx`

The toggle is rendered as a separate control above the form (not part of the name/slug form). It fires `toggleProductionOpen` immediately on change — no "Save" button needed. The ShareLink is conditionally dimmed when `isOpen` is false.

**Step 1: Update the Props interface and add imports**

Add `isOpen` to Props. Import `Switch`, `toggleProductionOpen`, `useAction` (already imported), and the Field components needed for the horizontal layout.

```tsx
// Add to existing imports:
import { toggleProductionOpen } from "@/actions/productions/toggle-production-open"
import { Switch } from "@/components/common/switch"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/common/field"

// Update Props interface:
interface Props {
  productionId: string
  orgSlug: string
  currentName: string
  currentSlug: string
  isOpen: boolean
}
```

**Step 2: Add toggle state and action inside the component**

Add a second `useAction` call for the toggle, plus local state to track optimistic updates:

```tsx
// Inside the component, after the existing useAction:
const [open, setOpen] = useState(isOpen)

const { execute: executeToggle } = useAction(toggleProductionOpen, {
  onError() {
    setOpen((prev) => !prev) // revert on failure
  },
})

function handleToggle(checked: boolean) {
  setOpen(checked)
  executeToggle({ productionId, isOpen: checked })
}
```

Add `useState` to the imports from React:

```tsx
import { useState } from "react"
```

**Step 3: Add the Switch UI above the form**

Insert a horizontal `Field` with the Switch before the `<form>` element. Wrap both in a fragment or restructure the return.

The full updated return should be:

```tsx
return (
  <>
    <Field orientation="horizontal">
      <FieldContent>
        <FieldTitle>Accepting submissions</FieldTitle>
        <FieldDescription>
          When on, candidates can find and submit to this production.
          When off, all audition pages for this production are hidden.
        </FieldDescription>
      </FieldContent>
      <Switch
        checked={open}
        onCheckedChange={handleToggle}
        aria-label="Toggle accepting submissions"
      />
    </Field>

    <form
      onSubmit={form.handleSubmit((v) =>
        execute({ productionId, name: v.name, slug: v.slug }),
      )}
    >
      <FieldGroup>
        {/* ... existing Controller fields ... */}

        {open ? (
          <ShareLink
            title="Audition page"
            description="Share this link with candidates so they can find all the roles in this production. Post it on social media, your website, or in audition notices."
            url={getAppUrl(`/s/${orgSlug}/${currentSlug}`)}
            href={`/s/${orgSlug}/${currentSlug}`}
          />
        ) : (
          <div className="flex flex-col gap-group pt-block opacity-50">
            <div className="flex flex-col gap-element">
              <p className="font-medium text-foreground text-label">
                Audition page
              </p>
              <p className="text-caption text-muted-foreground">
                Open submissions to share this link.
              </p>
            </div>
          </div>
        )}

        {/* ... existing error alert and save button ... */}
      </FieldGroup>
    </form>
  </>
)
```

**Step 4: Verify no lint errors**

Run: `bun run lint`
Expected: No errors.

---

### Task 3: Pass `isOpen` from the settings page

**Files:**
- Modify: `src/app/(app)/productions/[id]/settings/page.tsx`

**Step 1: Add the `isOpen` prop to the `ProductionSettingsForm` usage**

The `getProduction` call already returns all production fields including `isOpen`. Just pass it through:

```tsx
<ProductionSettingsForm
  productionId={production.id}
  orgSlug={production.organization.slug}
  currentName={production.name}
  currentSlug={production.slug}
  isOpen={production.isOpen}
/>
```

**Step 2: Verify no lint errors**

Run: `bun run lint`
Expected: No errors.

---

### Task 4: Block public production page when closed

**Files:**
- Modify: `src/app/s/[orgSlug]/[productionSlug]/page.tsx`

**Step 1: Add the `isOpen` check**

After the existing `if (!production)` check, add:

```tsx
if (!production.isOpen) return <NotFoundEntity entity="production" />
```

This goes right after line 42 (`if (!production) return <NotFoundEntity entity="production" />`).

**Step 2: Verify no lint errors**

Run: `bun run lint`
Expected: No errors.

---

### Task 5: Block public role page when closed

**Files:**
- Modify: `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`

**Step 1: Add the `isOpen` check**

After the existing `if (!production)` check, add:

```tsx
if (!production.isOpen) return <NotFoundEntity entity="production" />
```

This goes right after line 43 (`if (!production) return <NotFoundEntity entity="production" />`).

**Step 2: Verify no lint errors**

Run: `bun run lint`
Expected: No errors.

---

### Task 6: Final verification

**Step 1: Run the full lint/format check**

Run: `bun run lint`
Expected: Clean pass, no errors.

**Step 2: Run the build**

Run: `bun run build`
Expected: Build succeeds with no type errors.

---

## Manual testing checklist (for the user)

1. Go to production settings — verify the "Accepting submissions" toggle is visible
2. Toggle it on — verify the share link appears with the URL and copy/view buttons
3. Toggle it off — verify the share link is replaced with a dimmed "Open submissions to share this link" message
4. With toggle off, visit the public production URL — verify it shows "Production not found"
5. With toggle off, visit a role submission URL — verify it shows "Production not found"
6. Toggle back on — verify public pages work again
