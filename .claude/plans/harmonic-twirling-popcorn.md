# Visual Tweaks Plan

## Context

Three UI improvements: tighten the create-org dialog spacing, surface production/role status in the production header, and replace the productions card grid with a table.

---

## 1. Reduce spacing in Create Organization dialog

**File:** `src/components/organizations/create-org-dialog.tsx`

The `FieldGroup` component defaults to `gap-7` (28px). Override with `gap-block` (12px) by passing a className to the `<FieldGroup>` inside the dialog.

```tsx
<FieldGroup className="gap-block">
```

No changes to the shared `FieldGroup` component — this is a local override.

---

## 2. Production page header indicators

**Goal:** Show production status (open/closed/archived) and per-status role counts below the title.

### Data changes

**File:** `src/actions/productions/get-production.ts`

Add `roles` to the `with` clause so the layout has access to role data:

```ts
with: {
  organization: { columns: { name: true, slug: true } },
  roles: { columns: { id: true, status: true } },
},
```

### UI changes

**File:** `src/app/(app)/productions/[id]/(production)/layout.tsx`

Use `PageHeader`'s `description` prop to render:
- A badge for the production status (e.g., `Open`, `Closed`, `Archived`)
- Role counts grouped by status (e.g., "3 open, 1 closed")

The description will be a `ReactNode` with inline badges/text. Use the existing `Badge` component from `@/components/common/badge`.

Badge styling:
- Open → `variant="default"` (brand color)
- Closed → `variant="secondary"`
- Archived → `variant="outline"` with reduced opacity

Role count display: plain text in `text-muted-foreground`, showing counts only for statuses that have roles (e.g., "2 open roles, 1 closed" — skip statuses with 0).

---

## 3. Productions page — switch to table

**Goal:** Replace the card grid with a `@tanstack/react-table` table showing columns: Name, Status, Roles, Submissions.

### New file

**File:** `src/components/productions/productions-table.tsx` (client component)

- Use `createColumnHelper`, `useReactTable`, `getCoreRowModel`, `flexRender` from `@tanstack/react-table`
- Use existing `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@/components/common/table`
- Row clicks navigate to `/productions/{id}` via `useRouter`
- Columns:
  - **Name** — production name, plain text
  - **Status** — badge (same styling as header badges above)
  - **Roles** — role count number
  - **Submissions** — submission count number
- Archived rows get `opacity-60` (matching current card behavior)

### Page changes

**File:** `src/app/(app)/productions/page.tsx`

- Replace the card grid `<div className="grid ...">` with `<ProductionsTable>`
- Keep the show/hide archived toggle
- Remove `ProductionCard` import (file can stay for now; not deleting unused files)

### Pattern reference

Follow the same `@tanstack/react-table` patterns used in `src/components/productions/submission-table-view.tsx` — column helper, `useReactTable`, `flexRender` with the common table primitives.

---

## Verification

1. `bun run build` — no type errors
2. `bun run lint` — no lint issues
3. Manual checks (for user):
   - Visit create-org dialog → fields should be closer together
   - Visit `/productions/{id}` → header shows status badge + role counts
   - Visit `/productions` → table view with name, status, roles, submissions columns
