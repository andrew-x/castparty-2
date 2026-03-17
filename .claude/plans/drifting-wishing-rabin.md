# Plan: Fix Comparison View Scroll & Alignment

## Context

The comparison view dialog is implemented but has layout issues:
1. Columns are left-aligned instead of centered
2. Individual columns scroll vertically independently — they should not
3. The entire dialog body should scroll as one unit (both vertically and horizontally)

## File to Modify

**`src/components/productions/comparison-view.tsx`**

## Changes

### 1. Dialog body container (line 105)

**Current:**
```tsx
<div className="flex min-h-0 flex-1 gap-block overflow-x-auto p-block">
```

The `flex-1 min-h-0` constrains the body to the remaining viewport height and only scrolls horizontally. Columns that exceed this height get their own vertical scroll.

**New:**
```tsx
<div className="flex-1 overflow-auto p-block">
  <div className="mx-auto flex w-fit gap-block">
```

- Outer div: `flex-1 overflow-auto` — takes remaining height, scrolls both directions as one unit
- Inner div: `mx-auto flex w-fit gap-block` — `w-fit` shrinks to content width, `mx-auto` centers the row when columns fit in the viewport. When columns overflow, the outer container scrolls horizontally.

### 2. Column container (line 157)

**Current:**
```tsx
<div className="flex w-80 shrink-0 flex-col overflow-y-auto rounded-lg border border-border bg-card">
```

**New:**
```tsx
<div className="flex w-80 shrink-0 flex-col rounded-lg border border-border bg-card">
```

Remove `overflow-y-auto` — columns expand to their natural height. The parent body scrolls instead.

## Verification

1. `bun run build` — no type errors
2. `bun run lint` — Biome passes
3. Manual check:
   - 2-3 candidates: columns are centered in the viewport
   - 5+ candidates: horizontal scroll works, columns still centered initially
   - Tall columns (lots of form answers/headshots): the whole dialog body scrolls vertically, not individual columns
   - Header stays fixed at top while body scrolls
