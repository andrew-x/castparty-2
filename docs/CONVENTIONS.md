# Conventions

## Core Principles

### Developer Ergonomics First

Optimize for the developer reading the code, not just the machine executing it.
Maintainable, readable, and easy-to-work-with code is the default goal.
When brevity conflicts with clarity, choose clarity.

### Self-Documenting Code

Let naming, structure, and types communicate intent. Add comments only for:

- **Non-obvious logic** — e.g., a workaround for a library or browser quirk
- **Non-conventional patterns** — intentional deviation from the norm (explain why)
- **Especially complex algorithms or state machines**

Don't comment what the code clearly does. Comment *why* it does it.

## File & Naming

| What | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `UserProfile.tsx` |
| Utility modules | camelCase | `formatDate.ts` |
| Route directories | lowercase | `src/app/dashboard/` |
| Style files | kebab-case or `globals.scss` | `globals.scss` |

No barrel files (`index.ts` re-exports). Import from the actual file.

## TypeScript

### Prefer `interface` over `type`

Use `interface` for object shapes, component props, and API contracts.
Use `type` only when `interface` cannot express it:
- Union types: `type Status = "active" | "inactive"`
- Intersection types built from non-object shapes
- Mapped types and conditional types

### No `any`

Use `unknown` when the type is genuinely unknown, then narrow with guards.
`any` disables type checking — avoid it entirely.

## Component Patterns

- **Server components by default** — only add `"use client"` when the component needs browser APIs, event handlers, or state.
- **Props typing** — inline by default; switch to `interface Props` (not `type Props`) when readability suffers or the interface is referenced elsewhere. Use judgment.
- **No manual memoization** — React Compiler handles it. Don't add `useMemo`, `useCallback`, or `React.memo`.

## Styling

- Prefer Tailwind utility classes for all styling — over inline `style={}`, CSS Modules, or custom CSS. Reserve inline `style={}` only for values computed at runtime that cannot be expressed as a static Tailwind class.
- Biome enforces sorted classes (`useSortedClasses` rule).
- Dark mode is **not supported**. The design system is intentionally light-mode only.
- Design tokens use shadcn's CSS variable naming (`--primary`, `--background`, etc.) with Violet+Stone values, available as Tailwind utilities (e.g., `bg-primary`, `text-muted-foreground`). Supplementary tokens like `bg-cta` and `bg-success` are also available. See "Design Token Usage" below for the full reference.

## Voice & Tone

All UI copy follows the voice and tone rules in `.claude/rules/voice-and-tone.md`. Key points: plain rehearsal-room language, no jargon, no exclamation marks, no emoji, no em dashes. "Production team" for organizer-side users, "performer" for talent-side users -- no synonyms.

## Code Quality (Biome Config)

| Setting | Value |
|---------|-------|
| Indent | 2 spaces |
| Semicolons | as needed (omitted where optional) |
| Arrow parens | always (`(x) => ...`) |
| Bracket spacing | `{ x }` not `{x}` |
| Import organization | automatic (Biome assist) |
| Lint rules | recommended + React/Next.js domains |
| `noConsole` | warn |
| `useSortedClasses` | warn |

## Design Token Usage

Design tokens live in `src/app/globals.scss`. The primary layer uses **shadcn's CSS variable naming** (`--primary`, `--background`, `--card`, etc.) with Violet+Stone values, available as Tailwind utilities. Supplementary tokens (`--color-cta-*`, `--color-brand-*`, `--color-success-*`, etc.) are declared alongside them in `@theme inline`. See `docs/FEATURES.md#design-system` for architecture rationale.

### Token quick-reference

**shadcn variables** (available as Tailwind utilities via `bg-*`, `text-*`, `border-*`):

| Token | Tailwind class | Use |
|---|---|---|
| `--primary` | `bg-primary` / `text-primary` | Primary buttons, active states |
| `--primary-foreground` | `text-primary-foreground` | Text on primary-colored surfaces |
| `--secondary` | `bg-secondary` | Secondary action surfaces |
| `--muted` | `bg-muted` | Muted/inset areas |
| `--muted-foreground` | `text-muted-foreground` | Secondary/helper text |
| `--accent` | `bg-accent` | Hover and selected-item backgrounds (stone-100) |
| `--card` | `bg-card` | Card and panel surfaces |
| `--background` | `bg-background` | Page canvas |
| `--border` | `border-border` | Default dividers and outlines |
| `--destructive` | `bg-destructive` | Errors, danger actions |
| `--destructive-foreground` | `text-destructive-foreground` | Text on destructive surfaces |

**Supplementary tokens** (declared in `@theme inline` alongside the shadcn vars):

| Token | Tailwind class | Use |
|---|---|---|
| `--color-cta` | `bg-cta` / `text-cta` | Orange CTAs, notification badges |
| `--color-cta-hover` | `bg-cta-hover` | CTA hover state |
| `--color-cta-light` | `bg-cta-light` | CTA badge backgrounds |
| `--color-cta-text` | `text-cta-text` | Inline CTA labels |
| `--color-cta-fg` | `text-cta-fg` | Text/icons on CTA-colored surfaces |
| `--color-brand-hover` | `bg-brand-hover` | Primary button hover (violet-700) |
| `--color-brand-pressed` | `bg-brand-pressed` | Primary button active/pressed (violet-800) |
| `--color-brand-light` | `bg-brand-light` | Badge/chip backgrounds, selection highlight |
| `--color-brand-subtle` | `bg-brand-subtle` | Hover surface tints, nav active bg |
| `--color-brand-text` | `text-brand-text` | Inline brand labels/links |
| `--color-border-brand` | `border-border-brand` | Focus and brand-adjacent borders |
| `--color-success` / `-light` / `-text` | `bg-success`, etc. | Positive status |
| `--color-error` / `-light` / `-text` | `bg-error`, etc. | Errors, destructive actions |
| `--color-warning` / `-light` / `-text` | `bg-warning`, etc. | Cautionary states |

**Text hierarchy** (Tailwind stone palette — not tokenized):

| Level | Class |
|---|---|
| Primary | `text-stone-900` |
| Secondary | `text-stone-600` |
| Muted / placeholder | `text-stone-400` |
| Disabled | `text-stone-300` |

## Component Patterns — Design Token Usage

Standard Tailwind class recipes for common UI elements. Use these patterns consistently across all components.

### Buttons

```
# Primary (shadcn Button — variant="default")
bg-primary hover:bg-brand-hover text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold transition-colors

# Secondary (shadcn Button — variant="secondary")
bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-lg px-4 py-2 text-sm font-semibold transition-colors

# Ghost (shadcn Button — variant="ghost")
hover:bg-accent text-muted-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors

# Destructive (shadcn Button — variant="destructive")
bg-destructive hover:bg-error text-destructive-foreground rounded-lg px-4 py-2 text-sm font-semibold transition-colors

# CTA / Spotlight
bg-cta hover:bg-cta-hover text-cta-fg rounded-lg px-4 py-2 text-sm font-semibold transition-colors
```

### Cards and Panels

```
bg-card border border-border rounded-xl shadow-sm
```

### Inputs

```
bg-background border border-border focus:border-border-brand focus:ring-2 focus:ring-border-brand rounded-lg px-3 py-2 text-sm text-stone-900 placeholder:text-muted-foreground outline-none transition
```

### Sidebar / Nav

```
# Container
bg-sidebar border-r border-sidebar-border

# Active item
bg-brand-subtle text-brand-text font-medium rounded-md

# Inactive item
text-muted-foreground hover:bg-accent hover:text-stone-900 rounded-md
```

### Badges / Status Pills

```
# Brand
bg-brand-light text-brand-text text-xs font-medium rounded-full px-2 py-0.5

# Success
bg-success-light text-success-text text-xs font-medium rounded-full px-2 py-0.5

# Error
bg-error-light text-error-text text-xs font-medium rounded-full px-2 py-0.5

# Warning
bg-warning-light text-warning-text text-xs font-medium rounded-full px-2 py-0.5
```

### Focus Rings

Apply globally to all interactive elements:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

*Note: Inputs intentionally use `focus:ring-border-brand` (violet-300) instead of `ring-ring` — provides sufficient contrast for WCAG 2.1 SC 1.4.11 compliance.*

*Updated: 2026-02-27 — Migrated to shadcn CSS variable naming (--primary, --background, etc.) with Violet+Stone values*

## Icons (Lucide)

All icons use `lucide-react`. No special patterns required — import named components directly and use them anywhere (server or client components, no separate SSR import path).

```tsx
import { Camera, Heart } from "lucide-react"
```

Props: `size` (default `24`), `color` (default `currentColor`), `strokeWidth` (default `2`), `absoluteStrokeWidth`. All standard SVG attributes are also accepted.

Icons are `aria-hidden` by default. Add `aria-label` when the icon conveys meaning without surrounding text:

```tsx
<Check aria-label="Task completed" />
```

## Shared Layout Pattern — Centered Full-Viewport Pages

Pages that need to fill the full viewport and center their content (landing, 404, error pages) use this Tailwind recipe on their `<main>` element:

```
flex min-h-svh flex-col items-center justify-center px-4
```

`min-h-svh` (small viewport height) is used instead of `min-h-screen` to avoid the iOS Safari URL-bar resize glitch.

## Gotchas

- `next-env.d.ts` is auto-generated by Next.js — don't edit it.
- `bun.lock` is a binary lockfile — don't try to read or edit it.
- React Compiler is experimental (`babel-plugin-react-compiler` 1.0.0) — if you hit odd rendering bugs, check compiler output first.
- Biome's `noUnknownAtRules` is disabled to allow Tailwind v4 directives (`@theme`, `@import "tailwindcss"`).
- **`Button` cannot be used in statically prerendered server components.** The shadcn `Button` component imports `Slot` from `@radix-ui/react-slot`, which triggers "Minified React error #143" during `next build` on pages that are statically prerendered (e.g., `src/app/page.tsx`, `src/app/not-found.tsx`). Workaround: use a styled `<Link>` or `<button>` with equivalent Tailwind classes instead. The `Button` component works correctly in client components (`"use client"`), such as `src/app/error.tsx` and `src/app/global-error.tsx`.
