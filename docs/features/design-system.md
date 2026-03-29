# Design System

> **Last verified:** 2026-03-29

## Overview

A semantic CSS custom-property token system that defines the Violet+Stone visual language for Castparty. All UI colors, typography, spacing, and status states are expressed as design tokens rather than raw Tailwind palette values, keeping component code decoupled from specific color choices. The system also includes common component primitives (shadcn/ui based) that enforce consistent patterns.

## Token Architecture

Tokens are declared in a single `@theme inline` block in `src/styles/globals.scss`. The `@theme inline` directive makes them available to Tailwind v4 as utility classes (e.g., `bg-brand-light`, `text-success-text`).

### File Structure

| File | Purpose |
|------|---------|
| `src/styles/globals.scss` | All tokens, base styles, global CSS |
| `src/app/layout.tsx` | Root layout; loads DM Sans / DM Serif Display / DM Mono via `next/font/google` |
| `src/components/common/` | 40+ shadcn/ui-based primitives |

## Color Tokens

Two layers: shadcn structural variables (in `:root`) and Castparty semantic tokens (in `@theme inline`).

### shadcn Structural (`:root`)

| Variable | Value | Usage |
|----------|-------|-------|
| `--background` | white | Page background |
| `--foreground` | stone-900 | Default text |
| `--primary` | violet-600 | Primary actions, focus rings |
| `--secondary` | stone-100 | Secondary buttons |
| `--muted` | stone-100 | Muted backgrounds |
| `--muted-foreground` | stone-500 | Secondary text |
| `--destructive` | red-500 | Destructive actions |
| `--border` | stone-200 | Default borders |
| `--card` | stone-50 | Card backgrounds |

### CTA Tokens (Orange)

| Token | Value | Tailwind class |
|-------|-------|----------------|
| `--color-cta` | orange-500 | `bg-cta` |
| `--color-cta-hover` | orange-600 | `bg-cta-hover` |
| `--color-cta-light` | orange-100 | `bg-cta-light` |
| `--color-cta-subtle` | orange-50 | `bg-cta-subtle` |
| `--color-cta-fg` | white | `text-cta-fg` |
| `--color-cta-text` | orange-600 | `text-cta-text` |

### Brand Variants (Violet Supplementary)

| Token | Value | Tailwind class |
|-------|-------|----------------|
| `--color-brand-hover` | violet-700 | `bg-brand-hover` |
| `--color-brand-pressed` | violet-800 | `bg-brand-pressed` |
| `--color-brand-light` | violet-100 | `bg-brand-light` |
| `--color-brand-subtle` | violet-50 | `bg-brand-subtle` |
| `--color-brand-text` | violet-700 | `text-brand-text` |
| `--color-border-brand` | violet-300 | `border-border-brand` |

### Status Tokens

Each status group follows a consistent suffix pattern: *(none)* = main, `-light` = badge bg, `-subtle` = hover tint, `-fg` = text on main, `-text` = inline label.

| Group | Base | Light | Subtle | Text |
|-------|------|-------|--------|------|
| Success | green-600 | green-100 | green-50 | green-700 |
| Error | red-600 | red-100 | red-50 | red-700 |
| Warning | amber-500 | amber-100 | amber-50 | amber-600 |

## Typography Scale

| Token | Size | Usage | Tailwind |
|-------|------|-------|----------|
| `display` | 72px | Hero headings | `text-display` |
| `title` | 30px | Page/section titles | `text-title` |
| `heading` | 20px | Subsection headings | `text-heading` |
| `body-lg` | 18px | Lead/intro text | `text-body-lg` |
| `body` | 16px | Body text (default) | `text-body` |
| `label` | 14px | UI labels, buttons | `text-label` |
| `caption` | 12px | Fine print, badges | `text-caption` |

**Fonts:** DM Sans (body, `font-sans`), DM Serif Display (headings, `font-serif`), DM Mono (`font-mono`). Use `font-serif` for display and heading text.

## Spacing Scale

| Token | Value | Usage | Tailwind |
|-------|-------|-------|----------|
| `page` | 16px | Page edge padding | `px-page`, `pt-page` |
| `section` | 32px | Between major sections | `gap-section` |
| `group` | 24px | Between related groups | `gap-group` |
| `block` | 12px | Between block-level items | `gap-block` |
| `element` | 8px | Between tightly coupled elements | `gap-element` |
| `tight` | 4px | Minimal separation | `gap-tight` |

**Layout constraint:** `--spacing-page-content: 48rem` (768px) -- max content width for settings/form pages.

## Common Components

All in `src/components/common/`. Import via `@/components/common/{name}`.

### AutocompleteInput

Free-form combobox that combines `Input` with a filtered dropdown. Does not constrain to options.

| Prop | Default | Description |
|------|---------|-------------|
| `value` / `onChange` | -- | Controlled value |
| `options` | -- | Full list to filter from |
| `minChars` | `2` | Minimum chars before dropdown appears |
| `maxResults` | `20` | Cap on visible suggestions |
| `emptyMessage` | `"No results"` | Shown when filter produces nothing |

Client-side prefix match. Keyboard nav (ArrowUp/Down/Enter/Escape). ARIA: `role="combobox"`, `role="listbox"`.

### Drawer

`vaul`-based drawer supporting all four directions (top/bottom/left/right). Handle indicator for bottom drawers.

### Page

Layout primitives: `Page`, `PageHeader` (breadcrumbs + title + actions + tabs), `PageContent`, `PageBody` (side-nav + content).

### Field System

Form primitives: `FieldGroup`, `Field` (vertical/horizontal/responsive), `FieldLabel`, `FieldError` (with dedup, `role="alert"`), `FieldDescription`, `FieldSeparator`, `FieldSet`/`FieldLegend`.

### Empty State

Composable: `Empty` (outer wrapper), `EmptyHeader`, `EmptyMedia` (icon container), `EmptyTitle`, `EmptyDescription`, `EmptyContent` (actions).

### Button

Extended shadcn button. Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `xs`, `sm`, `lg`, `icon` variants. Extra props: `loading` (Spinner), `leftSection`/`rightSection`, `tooltip`, `href` (renders as Link).

### Other Notable Components

| Component | Notes |
|-----------|-------|
| `Combobox` | Full searchable select with keyboard nav |
| `Sheet` | Radix Dialog-based side panel (submission detail, mobile nav) |
| `Accordion` | Used in feedback panel |
| `AlertDialog` | Confirmation dialogs |
| `Badge` | Rounded-full pill, same variant system as Button |

## Integration Points

- All page layouts use `Page`/`PageHeader`/`PageContent`
- All forms use the `Field` system
- Empty states use the `Empty` composable
- `cn()` utility from `@/lib/util` (wrapping `clsx` + `tailwind-merge`) used in every component

## Architecture Decisions

- **Tokens in `@theme inline`.** Tailwind v4 generates utilities from `@theme` blocks. No separate config file needed.
- **Two token layers.** `:root` holds shadcn's oklch variables. `@theme inline` holds Castparty semantic tokens (hex). Bridged via `--color-primary: var(--primary)`.
- **Dark mode not supported.** `.dark` class contains only inherited shadcn defaults.
- **Free-form AutocompleteInput.** Users can enter values not in the dataset. Dropdown hidden until `minChars`.
- **shadcn/ui primitives, not custom.** Components in `common/` are shadcn/ui (sometimes extended). Always use existing; ask before adding new ones.
- **Spacing tokens over arbitrary values.** 6-step scale covers all common needs.
