# Landing Page, 404, and Error Pages

## Context

Castparty has no pages yet — just a blank div at `src/app/page.tsx`. We need a polished single-screen landing page, a 404 page, and error pages that establish the brand identity. All pages share a centered full-viewport layout with the violet + stone design system and DM font stack.

## Files to Create/Modify

| File | Action | Type |
|------|--------|------|
| `src/app/page.tsx` | Replace | Server component |
| `src/app/not-found.tsx` | Create | Server component |
| `src/app/error.tsx` | Create | Client component |
| `src/app/global-error.tsx` | Create | Client component |

No new dependencies. Uses existing `Button` from `@/components/common/button`, `Link` from `next/link`, and design tokens from `src/styles/globals.scss`.

## Step 1: Landing Page (`src/app/page.tsx`)

Replace the blank placeholder. Server component — no `"use client"`.

- `min-h-svh` centered layout with a subtle radial gradient using `var(--color-brand-subtle)` (violet-50) via inline `style` (gradient can't be expressed as a static Tailwind class)
- **"Castparty"** — `font-serif text-6xl text-stone-900 tracking-tight`
- **Tagline** — "The easiest way to cast your next show." in `text-lg text-stone-600`
- **CTA** — `Button asChild` wrapping `Link` to `/dashboard`, styled with `bg-cta hover:bg-cta-hover text-cta-fg`, size `lg`

## Step 2: 404 Page (`src/app/not-found.tsx`)

New file. Server component. Next.js serves this automatically for unmatched routes.

- Same centered layout, no gradient
- **"404"** — `font-serif text-9xl text-brand-light` (violet-100), `aria-hidden="true"` (decorative)
- **Copy** — "This page didn't make the callback list." in `text-2xl font-semibold text-stone-900`
- **Action** — `Button asChild variant="outline"` wrapping `Link` to `/`

## Step 3: Route Error Page (`src/app/error.tsx`)

New file. **Client component** (`"use client"`) — required by Next.js error boundary. Props: `{ error, reset }`.

- Same centered layout
- **Heading** — "Something went wrong backstage." in `font-serif text-3xl text-stone-900`
- **Description** — "We hit an unexpected issue. Give it another try." in `text-stone-600`
- **Actions** — Two buttons side by side: primary "Try again" (`onClick={reset}`), outline "Back to home" (`Link` to `/`)

## Step 4: Global Error Page (`src/app/global-error.tsx`)

New file. **Client component**. Must include own `<html>` and `<body>` tags (root layout may not have mounted). Imports `@/styles/globals.scss` directly.

- Same content as `error.tsx`
- No `TooltipProvider` (avoids dependency on context that may not exist)
- Font variables may not load (graceful fallback to system fonts — acceptable for error page)

## Subagents

- **frontend-design skill** — invoked to implement the 4 files with high design quality

## Verification

After implementation, run `bun build` to verify no build errors. Then manually check:

1. `/` — centered hero with violet gradient, serif heading, orange CTA button
2. `/anything-nonexistent` — 404 with decorative number, theatrical copy, outline button
3. Error pages — trigger by temporarily throwing in a page/layout component
