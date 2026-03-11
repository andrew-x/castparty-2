# Plan: Headshot Gallery Lightbox

## Context

When reviewing a submission in the `SubmissionDetailSheet`, headshots currently open in a new browser tab via `<a>` links. This is a disruptive experience — the casting director loses context by leaving the review sheet. A lightbox gallery lets them view full-size headshots inline, navigate between them, and return to the review without losing their place.

## Approach

Integrate the already-installed `yet-another-react-lightbox` (`^3.29.1`) into the submission detail sheet. Clicking a headshot thumbnail opens a full-screen lightbox overlay. All animations disabled for snappy, instant transitions. The lightbox is lazy-loaded via `next/dynamic` to avoid adding to the initial bundle.

## Steps

### 1. Create a lazy-loaded lightbox wrapper

**New file:** `src/components/common/headshot-lightbox.tsx`

A `"use client"` component that wraps `yet-another-react-lightbox`:

- Accepts `slides`, `open`, `index`, and `onClose` props
- Imports `yet-another-react-lightbox/styles.css`
- Uses the `Thumbnails` plugin for thumbnail strip navigation (+ its CSS)
- Uses the `Zoom` plugin so casting directors can inspect headshots closely
- All animations disabled for instant transitions:
  ```tsx
  animation={{ fade: 0, swipe: 0, navigation: 0 }}
  ```
- Exported via `next/dynamic` with `ssr: false` from the consuming component

Slide mapping: `headshots.map(h => ({ src: h.url, alt: h.filename }))`

Since headshots are external R2 URLs (not local files), we use the default image renderer — no `next/image` custom render needed.

### 2. Update `SubmissionDetailSheet` to use the lightbox

**File:** `src/components/productions/submission-detail-sheet.tsx`

Changes:
- Import the lightbox component via `next/dynamic` with `ssr: false`
- Add `lightboxIndex` state (`number | null`, initially `null`)
- Replace `<a href={headshot.url} target="_blank">` with a `<button onClick={() => setLightboxIndex(i)}>` that opens the lightbox at the clicked index
- Keep the thumbnail styling (aspect-square, rounded, border, object-cover)
- Render the lightbox component with:
  - `open={lightboxIndex !== null}`
  - `index={lightboxIndex ?? 0}`
  - `close={() => setLightboxIndex(null)}`
  - `slides` mapped from `submission.headshots`

### 3. Lint and build check

```bash
bun run lint
bun run build
```

## Files to modify

| File | Action |
|------|--------|
| `src/components/common/headshot-lightbox.tsx` | **Create** — lightbox wrapper component |
| `src/components/productions/submission-detail-sheet.tsx` | Update headshot grid to open lightbox on click |

## Verification

1. Run `bun run build` — no build errors
2. Run `bun run lint` — no lint errors
3. Manual check: open a submission with headshots, click a thumbnail → lightbox opens instantly at the correct image, navigate between images with arrows/thumbnails, zoom in, close with X or Escape, transitions are instant with no slide animation
