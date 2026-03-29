# Shrink Menu Font Sizes

## Context

The last commit (55c0ba8, "Apply audit quality improvements") replaced arbitrary font sizes like `text-[13.5px]` with the `text-label` token (14px). This made the side nav and header nav text noticeably larger than before. We need a new token at 13px for compact navigation contexts.

## Plan

### Step 1: Add `--text-label-sm` token

**File:** `src/styles/globals.scss`

Add between `--text-label` and `--text-caption`:
```scss
--text-label-sm: 0.8125rem;      /* 13px — compact nav, menus */
```

### Step 2: Register as Tailwind utility

Check how the existing tokens (`text-label`, `text-caption`, etc.) are wired into Tailwind. If via `@theme` or a CSS `@utility`, add `text-label-sm` the same way.

**Likely file:** `src/styles/globals.scss` (the tokens are likely consumed directly as CSS custom properties via Tailwind v4's automatic detection) or a Tailwind config if one exists.

### Step 3: Apply to side nav

**File:** `src/components/common/sub-nav.tsx` (line ~94)

Change `text-label` → `text-label-sm` on the expanded nav link class.

### Step 4: Apply to header nav

**File:** `src/components/app/top-nav.tsx` (line ~168)

Change `text-label` → `text-label-sm` on the desktop NavLink class.

## Files to modify

1. `src/styles/globals.scss` — add token + utility
2. `src/components/common/sub-nav.tsx` — use `text-label-sm`
3. `src/components/app/top-nav.tsx` — use `text-label-sm`

## Verification

1. Run `bun run build` to confirm no build errors
2. User visits any production page → side nav links should be 13px
3. User checks the top header nav → links should be 13px
4. Mobile nav should remain unchanged at `text-body` (16px)
