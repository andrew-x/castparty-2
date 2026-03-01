---
globs: ["src/**/*.tsx", "src/**/*.jsx", "src/**/*.css", "src/**/*.scss"]
---

# Design System

## Always use design tokens

All colors, text sizes, and spacing must come from tokens defined in `src/styles/globals.scss`.
Never use raw Tailwind values when a semantic token exists. Never use arbitrary values like
`bg-[#abc123]` or `text-[1.5rem]`.

```tsx
// Correct — semantic tokens
<div className="bg-brand text-foreground px-page gap-section" />
<h1 className="text-display" />
<p className="text-body-lg text-muted-foreground" />

// Wrong — raw values bypass the design system
<div className="bg-[#6c47ff] text-stone-900 px-4 gap-8" />
<h1 className="text-7xl" />
```

See `docs/CONVENTIONS.md#design-token-usage` for the full token reference.

## Extending the theme

If a design need can't be satisfied by an existing token, **do not use a raw value**. Instead,
propose a new token to the user:

> "There's no token for this use case. I'd suggest adding `--<type>-<name>` to
> `src/styles/globals.scss`. Should I do that?"

## Button sections (left/right)

The `Button` component supports `leftSection` and `rightSection` props for placing
icons or other elements alongside the button label. Use these instead of passing icons
as children alongside text.

```tsx
// Preferred — explicit icon placement
<Button leftSection={<PlusIcon />}>Add role</Button>
<Button rightSection={<ChevronRightIcon />}>Next</Button>

// Also fine — icon-only buttons (use size="icon" variants)
<Button variant="ghost" size="icon"><TrashIcon /></Button>

// Acceptable for simple cases — icon as child still works
<Button><PlusIcon /> Add role</Button>
```

When `loading` is true, the spinner replaces the `leftSection` automatically.

## Component library: shadcn/ui via `@/components/common`

All UI primitives come from **shadcn/ui**, installed into `src/components/common/`. Import from `@/components/common/<component>`, never from a third-party package directly.

```tsx
// Correct
import { Button } from "@/components/common/button";

// Wrong — bypasses our wrappers
import { Button } from "some-other-ui-lib";
```

### Rules

1. **Use what exists first.** Check `src/components/common/` before building anything new. Use the dev-docs skill to look up correct shadcn usage and props.
2. **Need a new shadcn component?** Don't install it yourself — tell the user: _"We need `<ComponentName>` from shadcn. Should I add it?"_
3. **Need something shadcn doesn't offer?** Tell the user before building it: _"shadcn doesn't have a `<ComponentName>`. I'd build a custom one in `src/components/common/`. Should I proceed?"_
4. **Keep common components minimal.** No feature-specific logic. They are generic primitives — styling, variants, and accessibility only.
5. **Consistency across components.** Follow the same patterns (variant props via CVA, `className` merging via `cn()`, `forwardRef` where needed) that the existing shadcn components use.

## Text colors must use theme tokens

Never use raw Tailwind color classes (e.g. `text-stone-900`, `text-stone-600`) for text.

| Level | Class |
|-------|-------|
| Primary | `text-foreground` |
| Muted / secondary | `text-muted-foreground` |

## Typography scale

Use the semantic type tokens instead of raw Tailwind size classes (`text-sm`, `text-3xl`, etc.):

| Token | Class | Size | Use |
|-------|-------|------|-----|
| Display | `text-display` | 4.5rem | Hero headings |
| Title | `text-title` | 1.875rem | Page/section titles |
| Heading | `text-heading` | 1.25rem | Subsection headings |
| Body large | `text-body-lg` | 1.125rem | Lead/intro text |
| Body | `text-body` | 1rem | Body text |
| Label | `text-label` | 0.875rem | UI labels, buttons |
| Caption | `text-caption` | 0.75rem | Fine print, badges |

Each token includes its own `line-height` and (for display) `letter-spacing`.

## Spacing scale

Use the semantic spacing tokens instead of raw Tailwind spacing (`gap-8`, `px-4`, etc.):

| Token | Class examples | Size | Use |
|-------|---------------|------|-----|
| Page | `px-page`, `py-page` | 1rem | Page edge padding |
| Section | `gap-section` | 2rem | Between major sections |
| Group | `gap-group` | 1.5rem | Between related groups |
| Block | `gap-block` | 0.75rem | Between block-level items |
| Element | `gap-element` | 0.5rem | Between tightly coupled elements |
