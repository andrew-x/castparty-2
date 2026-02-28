# Design Direction & Theme — Castparty

## Context

Castparty is a casting management platform (think ATS for performing arts) targeting a spectrum from independent theatre makers to large institutional studios. It needs a design system that:

- Reads as professional, sleek, and immediately trustworthy to institutional buyers
- Carries a distinctive performing arts identity that feels in the details, not the decoration
- Is light mode only
- Is built on Tailwind v4 semantic token conventions

**Direction chosen: Violet + Stone**
Stone (warm-toned neutral) evokes paper, scripts, and physical casting materials. Violet carries a natural theatrical quality without being costume-drama. Orange accent creates a "spotlight" energy on calls to action. Together they create a distinctive identity — recognizably creative, never corporate.

---

## What We're Delivering

**Scope: tokens only.** Rebuild `globals.css` with a complete semantic color and typography token system. No page changes — this is the foundation for all future UI work.

---

## Files to Modify

- `src/app/globals.css` — full rewrite of the `@theme` block; remove dark mode; establish semantic design tokens; add base body and selection styles

---

## Implementation

### 1. Remove dark mode

Strip the `@media (prefers-color-scheme: dark)` block entirely. Castparty is light mode only.

### 2. Replace `@theme inline` block

Replace the existing sparse theme block with a complete semantic token system. All custom colors map to specific Tailwind v4 palette values.

```css
@import "tailwindcss";

@theme inline {
  /* === Fonts === */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* === Brand — violet === */
  /* Primary actions, focus rings, nav active states */
  --color-brand:         #7c3aed; /* violet-600 */
  --color-brand-hover:   #6d28d9; /* violet-700 */
  --color-brand-pressed: #5b21b6; /* violet-800 */
  --color-brand-light:   #ede9fe; /* violet-100 — badge/chip backgrounds */
  --color-brand-subtle:  #f5f3ff; /* violet-50  — hover surface tints */
  --color-brand-fg:      #ffffff; /* text on brand-colored backgrounds */
  --color-brand-text:    #6d28d9; /* violet-700 — inline brand links/labels */

  /* === Accent — orange === */
  /* CTAs, highlights, notification badges, spotlight moments */
  --color-accent:        #f97316; /* orange-500 */
  --color-accent-hover:  #ea580c; /* orange-600 */
  --color-accent-light:  #ffedd5; /* orange-100 */
  --color-accent-subtle: #fff7ed; /* orange-50 */
  --color-accent-fg:     #ffffff;
  --color-accent-text:   #ea580c; /* orange-600 — inline accent text */

  /* === Surfaces — stone === */
  --color-surface:        #fafaf9; /* stone-50  — page background */
  --color-surface-raised: #ffffff; /* white     — cards, panels, modals */
  --color-surface-inset:  #f5f5f4; /* stone-100 — input backgrounds, sidebar sections */
  --color-surface-sunken: #e7e5e4; /* stone-200 — depressed areas, code blocks */

  /* === Borders — stone === */
  --color-border:        #e7e5e4; /* stone-200 — default dividers and outlines */
  --color-border-strong: #d6d3d1; /* stone-300 — emphasis borders */
  --color-border-brand:  #c4b5fd; /* violet-300 — focus and brand-adjacent borders */

  /* === Status: Success — green === */
  --color-success:        #16a34a; /* green-600 */
  --color-success-light:  #dcfce7; /* green-100 */
  --color-success-subtle: #f0fdf4; /* green-50 */
  --color-success-fg:     #ffffff;
  --color-success-text:   #15803d; /* green-700 */

  /* === Status: Error — red === */
  --color-error:        #dc2626; /* red-600 */
  --color-error-light:  #fee2e2; /* red-100 */
  --color-error-subtle: #fef2f2; /* red-50 */
  --color-error-fg:     #ffffff;
  --color-error-text:   #b91c1c; /* red-700 */

  /* === Status: Warning — amber === */
  --color-warning:        #f59e0b; /* amber-500 */
  --color-warning-light:  #fef3c7; /* amber-100 */
  --color-warning-subtle: #fffbeb; /* amber-50 */
  --color-warning-fg:     #ffffff;
  --color-warning-text:   #d97706; /* amber-600 */
}
```

### 3. Update base body styles

Replace the font-family fallback with the proper custom property and enable font smoothing. Set background from the new surface token.

```css
body {
  background-color: var(--color-surface);
  color: #1c1917; /* stone-900 — primary text */
  font-family: var(--font-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 4. Add selection highlight

```css
::selection {
  background-color: var(--color-brand-light);
  color: var(--color-brand-pressed);
}
```

---

## Component Conventions (not in CSS — for design doc)

These conventions define how developers apply the tokens. They are written into `docs/` after implementation by the librarian.

**Text hierarchy** (Tailwind stone palette used directly):
- Primary: `text-stone-900`
- Secondary: `text-stone-600`
- Muted/placeholder: `text-stone-400`
- Disabled: `text-stone-300`

**Buttons:**
- Primary: `bg-brand hover:bg-brand-hover text-brand-fg rounded-lg px-4 py-2 text-sm font-semibold transition-colors`
- Secondary: `bg-surface-inset hover:bg-surface-sunken text-stone-800 border border-border rounded-lg px-4 py-2 text-sm font-semibold transition-colors`
- Ghost: `hover:bg-surface-inset text-stone-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors`
- Destructive: `bg-error hover:bg-error-text text-error-fg rounded-lg px-4 py-2 text-sm font-semibold transition-colors`

**Cards / panels:**
`bg-surface-raised border border-border rounded-xl shadow-sm`

**Inputs:**
`bg-surface-raised border border-border focus:border-border-brand focus:ring-2 focus:ring-brand-subtle rounded-lg px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition`

**Sidebar / nav:**
- Container: `bg-surface-inset border-r border-border`
- Active item: `bg-brand-subtle text-brand-text font-medium rounded-md`
- Inactive item: `text-stone-600 hover:bg-surface-sunken hover:text-stone-900 rounded-md`

**Badges / status pills:**
- Brand: `bg-brand-light text-brand-text text-xs font-medium rounded-full px-2 py-0.5`
- Success: `bg-success-light text-success-text text-xs font-medium rounded-full px-2 py-0.5`
- Error: `bg-error-light text-error-text text-xs font-medium rounded-full px-2 py-0.5`
- Warning: `bg-warning-light text-warning-text text-xs font-medium rounded-full px-2 py-0.5`

**Focus rings** (global convention):
`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2`

---

## Agents Invoked

1. **Explore subagent** (Phase 1) — read current `globals.css`, layout, page, and dependencies
2. **Plan subagent** — not needed; implementation is a direct file rewrite with clear spec above
3. **Librarian subagent** (post-implementation) — update `docs/FEATURES.md` and `docs/CONVENTIONS.md` with design system conventions and token reference

---

## Verification

After implementation, the developer should:

1. Run `bun dev`
2. Visit `http://localhost:3000` — page background should be warm stone-50 (`#fafaf9`), not white
3. Inspect `body` in DevTools — confirm `background-color: var(--color-surface)` resolves to `#fafaf9`
4. Confirm `--color-brand` is available in DevTools computed styles as `#7c3aed`
5. Run `bun run lint` — should pass with no errors
6. Add a test element: `<div class="bg-brand text-brand-fg p-4 rounded-lg">Test</div>` in page.tsx — should render violet with white text
