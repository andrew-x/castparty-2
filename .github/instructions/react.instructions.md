---
applyTo: "**/*.tsx"
---

# React Conventions

## Server Components by Default

Only add `"use client"` when a component genuinely needs browser APIs, event handlers,
or React state. Pass server-fetched data down as props rather than fetching in client
components when possible.

## Component Props

Inline props by default:

```tsx
export function Button({ label, onClick }: { label: string; onClick: () => void }) { ... }
```

Switch to a named `interface Props` (not `type Props`) when:

- The inline form hurts readability due to many props
- The interface needs to be referenced in multiple places

Use judgment — there is no hard threshold.

## No Manual Memoization

React Compiler handles it. Don't add `useMemo`, `useCallback`, or `React.memo`.

## Always Use Common Components

All UI elements must use components from `src/components/common/`. Never use raw HTML
elements when a common component exists:

```tsx
// Correct
import { Button } from "@/components/common/button"
import { Input } from "@/components/common/input"

// Wrong — raw HTML bypasses design system
<button className="...">Save</button>
<input className="..." />
```

If a common component doesn't support your use case, flag it rather than working around it.

## Button Component

The `Button` component supports:

- `leftSection` / `rightSection` props for icons alongside labels
- `loading` prop — spinner replaces `leftSection` automatically
- `href` prop — renders as a Next.js `Link` (works in server components)

```tsx
<Button leftSection={<PlusIcon />}>Add role</Button>
<Button loading={isPending}>Saving...</Button>
<Button href="/auth" size="lg">Get Started</Button>
```

## Styling

Prefer Tailwind utility classes for all styling over inline `style={}`, CSS Modules,
or custom CSS. Reserve inline `style={}` only for values computed at runtime that
cannot be expressed as a static Tailwind class.

## Icons (Lucide)

All icons use `lucide-react`. Import named components directly:

```tsx
import { Camera, Heart } from "lucide-react"
```

Icons are `aria-hidden` by default. Add `aria-label` when the icon conveys meaning
without surrounding text.

## Backend Integration

**Writes (client-callable):** Use `next-safe-action` with `secureActionClient`:

```ts
export const createProduction = secureActionClient
  .metadata({ action: "create-production" })
  .inputSchema(z.object({ name: z.string().trim().min(1) }))
  .action(async ({ parsedInput, ctx: { user } }) => { ... })
```

**Reads (server-only):** Plain `async` functions with `checkAuth()`, called directly
from server components.
