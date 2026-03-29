## React Patterns Audit

### Critical
None

### Important
- **[src/components/common/table.tsx:1]**: Unnecessary `"use client"` directive — this component contains zero hooks, zero event handlers, zero Radix primitives, and zero browser APIs. It is purely wrapping HTML table elements (`<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, `<td>`, `<caption>`) with className styling. — Remove the `"use client"` directive so it can be rendered as a server component, reducing the client JS bundle.

### Minor
None

### No Issues
The following patterns were checked and found to be clean:
- **No manual `useMemo`/`useCallback`/`React.memo`**: The single `React.useMemo` in `sidebar.tsx:605` wraps `Math.random()` for run-once stability, which is the documented exception.
- **`"use client"` usage**: All other `"use client"` components genuinely require it (hooks, event handlers, Radix primitives, or browser APIs). All `page.tsx` and `layout.tsx` files are server components.
- **Props naming**: No `type Props =` found; all named props use `interface Props`. `type` aliases in `button.tsx`, `pagination.tsx`, and `sidebar.tsx` are justified because they use unions or intersections that cannot be expressed as interfaces.
- **No stale closures or hook dependency issues**: Spot-checked `useEffect` calls across 10+ components; all have correct dependency arrays or appropriate suppression comments.
- **No raw HTML elements where common components exist**: Zero instances of raw `<button>`, `<input>`, `<textarea>`, `<label>`, or `<a>` elements outside of the common component definitions themselves.
- **No `new Date()` or direct `dayjs` imports**: All date handling uses the project wrapper.
- **`style={}` usage**: All inline style uses are for runtime-computed values (dynamic `gridTemplateColumns`, drag opacity, CSS custom properties) that cannot be expressed as static Tailwind classes — all legitimate.
- **Next.js App Router patterns**: Server components are the default. Data fetching happens in server components. No page-level `"use client"` directives.
