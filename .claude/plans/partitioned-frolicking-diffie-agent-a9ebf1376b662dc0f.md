## React Patterns Audit

### Critical
None

### Important
- **[src/components/common/preview-link-buttons.tsx:34]**: Raw `<button>` used for the copy-link action instead of the common `<Button>` component. This button has hover states, icon sizing, and rounded styling that map directly to `Button variant="ghost" size="icon"`. — Replace with `<Button variant="ghost" size="icon" ...>` (or `size="icon-sm"`) and remove the manual Tailwind classes.
- **[src/components/productions/feedback-form-preview.tsx:1]**: `"use client"` directive is unnecessary. This component uses no hooks, state, event handlers, or browser APIs -- it only renders disabled preview UI. Server components can import and render client components. — Remove `"use client"`.
- **[src/components/productions/submission-form-preview.tsx:1]**: Same as above. `"use client"` directive is unnecessary -- no hooks, state, or interactivity. — Remove `"use client"`.

### Minor
- **[src/components/productions/consider-for-role-dialog.tsx:160]**: Raw `<button>` used for role selection list items inside a popover-like list. While the heavy custom styling makes Button less natural, these are functionally selectable list items that could use `Button variant="ghost"` with `className` overrides for consistent focus/accessibility handling. — Consider switching to `<Button variant="ghost" className="justify-start ...">` for built-in focus-visible ring and disabled state handling, though current implementation is functional.
- **[src/components/productions/stage-controls.tsx:60]**: Raw `<button>` for stage selection items in a popover menu. Same reasoning as above. — Consider `<Button variant="ghost">` for consistent focus handling.

### No Issues
- **useMemo/useCallback/React.memo**: Only one `React.useMemo` found (`sidebar.tsx:605`) wrapping `Math.random()` -- this is the documented exception for non-deterministic run-once stability. No other manual memoization found.
- **useEffect patterns**: All `useEffect` calls have correct dependency arrays. No stale closures detected. Effects are used appropriately for form resets on dialog open/close, sync with server data, keyboard shortcuts, and DOM manipulation.
- **Props conventions**: No `type Props` found -- all named prop types use `interface Props` or inline destructuring as the rules specify.
- **Inline styles**: All `style={}` usages are for runtime-computed values that cannot be expressed as static Tailwind classes (dynamic `gridTemplateColumns`, complex radial gradients with CSS variables, drag opacity).
- **Raw HTML elements (button)**: Most raw `<button>` elements are justified -- drag handles, image thumbnail wrappers, kanban card click areas, upload drop zones, and sidebar rail. These have custom layouts/semantics that don't map to Button variants.
- **Raw HTML elements (other)**: No raw `<input>`, `<select>`, `<label>`, or `<table>` elements found -- all use common components.
- **App Router patterns**: `src/app/` files are correctly server components by default; only `error.tsx` and `global-error.tsx` use `"use client"` (required by Next.js error boundary convention). Data fetching uses server functions and actions, not client-side `useEffect` fetching (except the justified `consider-for-role-dialog.tsx` which loads roles on-demand when a dialog opens).
- **new Date()**: No `new Date()` usage found in components (dayjs rule is respected).
