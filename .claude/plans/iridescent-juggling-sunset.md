# Plan: Copy full URLs + non-full-width submit buttons

## Context

Two issues with the current submission flow:

1. **CopyButton copies relative paths** (e.g. `/submit/org-abc`) instead of full URLs (e.g. `https://castparty.app/submit/org-abc`). When a production team member shares the link, the performer gets a relative path that's useless outside the browser. The display should still show just the path, but the clipboard should get the full URL.

2. **Submit buttons stretch full-width** inside `FieldGroup` (which is `flex flex-col` — children stretch by default). The user wants form submit buttons to NOT be full width, as a general pattern.

---

## Changes

### 1. Add `NEXT_PUBLIC_APP_URL` env var

Add to `.env`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

This is the standard Next.js pattern for a client-accessible base URL. In production, set to the real domain.

### 2. Create `src/lib/url.ts` — URL helper

```ts
export function getAppUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return `${base}${path}`
}
```

Simple, no over-engineering. Works on both server and client (NEXT_PUBLIC_ prefix).

### 3. Update CopyButton usages — copy full URL, display path

All three call sites currently pass a relative path as `value`. Change to pass the full URL via `getAppUrl()`:

**`src/app/(app)/home/page.tsx`** (server component — can use the helper directly):
```tsx
<CopyButton value={getAppUrl(`/submit/${orgId}`)} />
```

**`src/app/(app)/productions/[id]/page.tsx`** (server component):
```tsx
<CopyButton value={getAppUrl(`/submit/${production.organizationId}/${production.id}`)} />
```

**`src/components/productions/roles-list.tsx`** (client component — `NEXT_PUBLIC_` env vars are inlined at build time, so `getAppUrl()` works here too):
```tsx
<CopyButton value={getAppUrl(`/submit/${orgId}/${productionId}/${role.id}`)} />
```

The displayed text (the `<p>` element) keeps showing just the path — only the copied value changes.

### 4. Add `w-fit` to submit buttons

**`src/components/submissions/submission-form.tsx`** — line 142-144:
```tsx
// Before
<Button type="submit" loading={isPending}>

// After
<Button type="submit" loading={isPending} className="w-fit">
```

The `FieldGroup` is `flex flex-col` which stretches children. Adding `w-fit` overrides this to keep the button at content width.

---

## Files

| File | Action |
|------|--------|
| `.env` | **Modify** — add `NEXT_PUBLIC_APP_URL=http://localhost:3000` |
| `src/lib/url.ts` | **Create** — `getAppUrl()` helper |
| `src/app/(app)/home/page.tsx` | **Modify** — import `getAppUrl`, pass full URL to CopyButton |
| `src/app/(app)/productions/[id]/page.tsx` | **Modify** — same |
| `src/components/productions/roles-list.tsx` | **Modify** — same |
| `src/components/submissions/submission-form.tsx` | **Modify** — add `className="w-fit"` to submit button |

---

## Verification

1. `bun run lint` + `bun run build` — clean
2. Manual: click copy button on home page → paste → should be `http://localhost:3000/submit/org-xxx`
3. Manual: displayed text still shows just `/submit/org-xxx` (no domain in the UI)
4. Manual: submit button on audition form is content-width, not full-width
