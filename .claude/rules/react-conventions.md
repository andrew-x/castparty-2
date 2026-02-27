---
paths:
  - "**/*.tsx"
---

# React Conventions

## Component Props

Inline props by default:

```tsx
export function Button({ label, onClick }: { label: string; onClick: () => void }) { ... }
```

Switch to a named `interface Props` (not `type Props`) when:
- The inline form hurts readability due to many props
- The interface needs to be referenced in multiple places

Use judgment — there is no hard threshold.

## Styling

Prefer Tailwind utility classes for all styling.
Prefer Tailwind over inline `style={}`, CSS Modules, or custom CSS.
Reserve inline `style={}` only for values computed at runtime that cannot be
expressed as a static Tailwind class.
