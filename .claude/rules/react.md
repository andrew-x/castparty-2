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

## React Compiler (Automatic Memoization)

The React Compiler (`babel-plugin-react-compiler`) is enabled in this project. It
automatically memoizes components, values, and callbacks at build time.

**Do not** use `useMemo`, `useCallback`, or `React.memo` for performance optimization.
The compiler handles this automatically and does a better job than manual attempts.

```tsx
// Correct — let the compiler handle it
const filtered = items.filter((item) => item.active)
const handleClick = () => doSomething(id)

// Wrong — redundant manual memoization
const filtered = useMemo(() => items.filter((item) => item.active), [items])
const handleClick = useCallback(() => doSomething(id), [id])
```

### Exceptions

Keep manual memoization only when it provides **semantic guarantees** beyond performance:

1. **Non-deterministic calls that need run-once-on-mount stability.** For example,
   `Math.random()` wrapped in `useMemo` with `[]` deps ensures the value is computed
   once and stays stable across re-renders.

2. **Effect dependency control.** When a memoized value is used as an effect
   dependency and you need precise control over when the effect fires.

If unsure, err on the side of removing — the compiler will handle it.
