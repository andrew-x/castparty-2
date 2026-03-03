# Remove Redundant Manual Memoization & Add Rule

## Context

The React Compiler is enabled in this project (`reactCompiler: true` in `next.config.ts`, `babel-plugin-react-compiler@1.0.0` in devDependencies). The compiler automatically memoizes components, values, and callbacks at build time — making manual `useMemo`, `useCallback`, and `React.memo` redundant in most cases.

The codebase has 7 instances of manual memoization across 3 files. 6 are safe to remove; 1 must be kept because it uses `Math.random()` (a non-deterministic call that needs run-once-on-mount semantics, not performance memoization).

## Changes

### 1. Remove `useCallback` from `onboarding-flow.tsx`

**File:** `src/components/onboarding/onboarding-flow.tsx`

Remove `useCallback` wrapper from two handlers (lines 36-43), converting them to plain functions:

- `handleAccept` — `useCallback((id: string) => { ... }, [])` → plain arrow function
- `handleIgnore` — `useCallback((id: string) => { ... }, [])` → plain arrow function

Also remove the `useCallback` import.

### 2. Remove `useMemo` from `field.tsx`

**File:** `src/components/common/field.tsx`

Remove `useMemo` wrapper from the `content` derivation in `FieldError` (lines 194-219). Convert to a plain `const content = (() => { ... })()` IIFE or inline the logic directly.

Also remove the `useMemo` import if it becomes unused.

### 3. Remove memoization from `sidebar.tsx` (keep `Math.random` one)

**File:** `src/components/common/sidebar.tsx`

Remove 3 of 4 memoization hooks in `SidebarProvider`:

- `setOpen` (line 75) — `React.useCallback(...)` → plain function
- `toggleSidebar` (line 92) — `React.useCallback(...)` → plain function
- `contextValue` (line 116) — `React.useMemo(...)` → plain object literal

**Keep** the `width` `useMemo` in `SidebarMenuSkeleton` (line 610) — this wraps `Math.random()` and serves as a run-once-on-mount stability guarantee, not a performance optimization. Without it, the skeleton width would re-randomize on every render.

### 4. Add new rule: `react-compiler.md`

**File:** `.claude/rules/react-compiler.md`

Scoped to frontend files (`**/*.tsx`) via frontmatter. Documents:

- The React Compiler handles memoization automatically — do not use `useMemo`, `useCallback`, or `React.memo` for performance
- Exception: keep manual memoization when wrapping non-deterministic calls (e.g., `Math.random()`) that need run-once-on-mount semantics
- Exception: keep manual memoization when a memoized value is used as an effect dependency and you need precise control over when the effect fires
- Reference the React Compiler docs for edge cases

### 5. Update `react-conventions.md` (optional cross-reference)

Add a one-line note under the existing rules referencing the new `react-compiler.md` rule, so developers know the convention exists.

## Files Modified

| File | Action |
|------|--------|
| `src/components/onboarding/onboarding-flow.tsx` | Remove 2 `useCallback` wrappers + import |
| `src/components/common/field.tsx` | Remove 1 `useMemo` wrapper + import |
| `src/components/common/sidebar.tsx` | Remove 3 memoization hooks (keep `Math.random` one) |
| `.claude/rules/react-compiler.md` | **New file** — scoped rule for React Compiler conventions |
| `.claude/rules/react-conventions.md` | Add cross-reference to new rule |

## Verification

1. Run `bun run build` — confirm no TypeScript or build errors
2. Run `bun run lint` — confirm Biome passes
3. Manually verify the sidebar still works (open/close, keyboard shortcut Cmd+B, mobile sheet)
4. Verify the onboarding flow still resolves invitations correctly
5. Verify form field errors still render and deduplicate correctly
