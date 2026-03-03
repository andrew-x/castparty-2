---
paths:
  - "**/*.tsx"
---

# React Compiler

The React Compiler (`babel-plugin-react-compiler`) is enabled in this project. It
automatically memoizes components, values, and callbacks at build time.

## Do not manually memoize for performance

Do not use `useMemo`, `useCallback`, or `React.memo` for performance optimization.
The compiler handles this automatically and does a better job than manual attempts.

```tsx
// Correct — let the compiler handle it
const filtered = items.filter((item) => item.active)
const handleClick = () => doSomething(id)

// Wrong — redundant manual memoization
const filtered = useMemo(() => items.filter((item) => item.active), [items])
const handleClick = useCallback(() => doSomething(id), [id])
```

## Exceptions

Keep manual memoization only when it provides **semantic guarantees** beyond performance:

1. **Non-deterministic calls that need run-once-on-mount stability.** For example,
   `Math.random()` wrapped in `useMemo` with `[]` deps ensures the value is computed
   once and stays stable across re-renders — without it, the value would change on
   every render.

2. **Effect dependency control.** When a memoized value is used as an effect
   dependency and you need precise control over when the effect fires, manual
   `useMemo` may still be appropriate.

If you're unsure whether a case qualifies, err on the side of removing the manual
memoization — the compiler will handle it.
