---
applyTo: "**/*.tsx,**/*.scss"
---

# Design System

## Always Use Design Tokens

All colors, text sizes, and spacing must come from tokens defined in
`src/styles/globals.scss`. Never use raw Tailwind values when a semantic token exists.
Never use arbitrary values like `bg-[#abc123]` or `text-[1.5rem]`.

```tsx
// Correct
<div className="bg-brand text-foreground px-page gap-section" />

// Wrong
<div className="bg-[#6c47ff] text-stone-900 px-4 gap-8" />
```

## Text Colors — Theme Tokens Only

| Level | Class |
|---|---|
| Primary | `text-foreground` |
| Muted / secondary | `text-muted-foreground` |

Never use raw Tailwind color classes (e.g., `text-stone-900`, `text-stone-600`).

## Color Tokens

**shadcn variables** (available via `bg-*`, `text-*`, `border-*`):

| Token | Class | Use |
|---|---|---|
| `--primary` | `bg-primary` / `text-primary` | Primary buttons, active states |
| `--primary-foreground` | `text-primary-foreground` | Text on primary surfaces |
| `--secondary` | `bg-secondary` | Secondary action surfaces |
| `--muted` | `bg-muted` | Muted/inset areas |
| `--muted-foreground` | `text-muted-foreground` | Secondary/helper text |
| `--accent` | `bg-accent` | Hover and selected-item backgrounds |
| `--card` | `bg-card` | Card and panel surfaces |
| `--background` | `bg-background` | Page canvas |
| `--border` | `border-border` | Default dividers and outlines |
| `--destructive` | `bg-destructive` | Errors, danger actions |

**Supplementary tokens:**

| Token | Class | Use |
|---|---|---|
| `--color-cta` | `bg-cta` / `text-cta` | Orange CTAs, notification badges |
| `--color-brand-hover` | `bg-brand-hover` | Primary button hover |
| `--color-brand-light` | `bg-brand-light` | Badge/chip backgrounds |
| `--color-brand-subtle` | `bg-brand-subtle` | Hover tints, nav active bg |
| `--color-brand-text` | `text-brand-text` | Brand labels/links |
| `--color-success` | `bg-success` | Positive status |
| `--color-error` | `bg-error` | Errors |
| `--color-warning` | `bg-warning` | Cautionary states |

## Typography Scale

Use semantic type tokens instead of raw Tailwind size classes:

| Token | Class | Size | Use |
|---|---|---|---|
| Display | `text-display` | 4.5rem | Hero headings |
| Title | `text-title` | 1.875rem | Page/section titles |
| Heading | `text-heading` | 1.25rem | Subsection headings |
| Body large | `text-body-lg` | 1.125rem | Lead/intro text |
| Body | `text-body` | 1rem | Body text |
| Label | `text-label` | 0.875rem | UI labels, buttons |
| Caption | `text-caption` | 0.75rem | Fine print, badges |

## Spacing Scale

Use semantic spacing tokens instead of raw Tailwind spacing:

| Token | Class | Size | Use |
|---|---|---|---|
| Page | `px-page` | 1rem | Page edge padding |
| Section | `gap-section` | 2rem | Between major sections |
| Group | `gap-group` | 1.5rem | Between related groups |
| Block | `gap-block` | 0.75rem | Between block-level items |
| Element | `gap-element` | 0.5rem | Between tightly coupled elements |

## Component Recipes

### Cards and Panels

```
bg-card border border-border rounded-xl shadow-sm
```

### Badges / Status Pills

```
# Brand
bg-brand-light text-brand-text text-xs font-medium rounded-full px-2 py-0.5

# Success
bg-success-light text-success-text text-xs font-medium rounded-full px-2 py-0.5

# Error
bg-error-light text-error-text text-xs font-medium rounded-full px-2 py-0.5
```

### Focus Rings

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

## Extending the Theme

If a design need can't be satisfied by an existing token, propose a new token:

> "There's no token for this use case. I'd suggest adding `--<type>-<name>` to
> `src/styles/globals.scss`. Should I do that?"

## Fonts

DM Sans (body) + DM Serif Display (headings) + DM Mono.
Use `font-serif` for display/heading text.

## Dark Mode

Not supported. The design system is intentionally light-mode only.
