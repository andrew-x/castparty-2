# Plan: Refine Submission Flow

## Context

The submission flow was built in the previous session. Four refinements are needed:

1. **Remove the `(submission)` route group** — unnecessary wrapper since `/submit` already defines the path
2. **Add copy-to-clipboard buttons** on all submission link displays in the app side
3. **Better success state** — tell performers the production team will review
4. **Center-aligned layout with max width** — inspired by ATS candidate portals

---

## Changes

### 1. Move routes from `(submission)/submit/` to `submit/`

Delete the entire `src/app/(submission)/` directory. Move the four files to `src/app/submit/`:

| From | To |
|------|-----|
| `src/app/(submission)/layout.tsx` | `src/app/submit/layout.tsx` (rewritten, see below) |
| `src/app/(submission)/submit/[orgId]/page.tsx` | `src/app/submit/[orgId]/page.tsx` (verbatim) |
| `src/app/(submission)/submit/[orgId]/[productionId]/page.tsx` | `src/app/submit/[orgId]/[productionId]/page.tsx` (verbatim) |
| `src/app/(submission)/submit/[orgId]/[productionId]/[roleId]/page.tsx` | `src/app/submit/[orgId]/[productionId]/[roleId]/page.tsx` (verbatim) |

URLs don't change — they were already `/submit/...`.

### 2. Redesign `src/app/submit/layout.tsx` — centered, max-width

```tsx
<main className="flex min-h-svh flex-col items-center px-page">
  <div className="flex w-full max-w-3xl flex-col gap-section py-section">
    <header className="flex items-center gap-element">
      <Image ... />
      <span className="font-serif text-foreground text-heading">Castparty</span>
    </header>
    {children}
  </div>
</main>
```

- `items-center` on `<main>` centers the content column
- `max-w-3xl` (768px) — wide enough for role lists, narrow enough to feel focused
- The role-form page's own `max-w-lg` still applies inside this container

### 3. Create `src/components/common/copy-button.tsx`

New `"use client"` component. Uses `navigator.clipboard.writeText()`, `useState` for copied state, 2-second auto-reset.

- `Button variant="ghost" size="icon-sm"` with `CopyIcon` / `CheckIcon`
- Wrapped in `Tooltip` from `@/components/common/tooltip` (provider already in root layout)
- Props: `value: string`

### 4. Add copy buttons to app-side link displays

**`src/app/(app)/home/page.tsx`** — wrap URL text + `<CopyButton>` in a flex row
**`src/app/(app)/productions/[id]/page.tsx`** — same pattern
**`src/components/productions/roles-list.tsx`** — add `<CopyButton>` inline with each role's URL text

### 5. Update success state in `src/components/submissions/submission-form.tsx`

```tsx
if (submitted) {
  return (
    <Alert>
      <AlertTitle>Submission received</AlertTitle>
      <AlertDescription>
        The production team will review your submission and be in touch if they want to move forward.
      </AlertDescription>
    </Alert>
  )
}
```

Import `AlertTitle` from `@/components/common/alert` (already exported).

---

## Implementation Order

1. Create `src/components/common/copy-button.tsx` (dependency for steps 3-4)
2. Create `src/app/submit/layout.tsx` (new centered layout)
3. Move the three page files from `(submission)/submit/` to `submit/`
4. Delete `src/app/(submission)/` directory
5. Modify app-side files: home page, production page, roles list (add copy buttons)
6. Modify `submission-form.tsx` (update success state)
7. `bun run lint` + `bun run build`

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/common/copy-button.tsx` | **Create** |
| `src/app/submit/layout.tsx` | **Create** (replaces old layout) |
| `src/app/submit/[orgId]/page.tsx` | **Create** (moved verbatim) |
| `src/app/submit/[orgId]/[productionId]/page.tsx` | **Create** (moved verbatim) |
| `src/app/submit/[orgId]/[productionId]/[roleId]/page.tsx` | **Create** (moved verbatim) |
| `src/app/(submission)/` | **Delete** entire directory |
| `src/app/(app)/home/page.tsx` | **Modify** — add CopyButton |
| `src/app/(app)/productions/[id]/page.tsx` | **Modify** — add CopyButton |
| `src/components/productions/roles-list.tsx` | **Modify** — add CopyButton per role |
| `src/components/submissions/submission-form.tsx` | **Modify** — update success state |

---

## Verification

1. `bun run lint` — clean
2. `bun run build` — routes appear as `/submit/[orgId]`, `/submit/[orgId]/[productionId]`, `/submit/[orgId]/[productionId]/[roleId]`
3. Manual: submission pages are centered with max-width constraint
4. Manual: copy buttons show tooltip, copy the URL, show checkmark for 2 seconds
5. Manual: after form submission, see "Submission received" + review message
