# Add click-to-dismiss in lightbox

## Context

When viewing a headshot in the lightbox (powered by `yet-another-react-lightbox`), clicking the dark backdrop area does nothing — the user can only close via the X button. The lightbox should close on backdrop click, but it must **not** also close the submission detail Sheet behind it.

## Changes

### 1. Enable backdrop click closing in `HeadshotLightbox`

**File:** `src/components/productions/headshot-lightbox.tsx`

Add the `controller` prop to explicitly enable closing on backdrop click:

```tsx
<Lightbox
  controller={{ closeOnBackdropClick: true }}
  ...existing props
/>
```

### 2. Guard the Sheet against lightbox dismiss events

**File:** `src/components/productions/submission-detail-sheet.tsx`

Add `onInteractOutside` to `SheetContent` to prevent the Sheet from closing when the lightbox is open. This fires on `pointerdown` (before the lightbox processes the `click`), so `lightboxOpen.current` is still `true`:

```tsx
<SheetContent
  onInteractOutside={(e) => {
    if (lightboxOpen.current) e.preventDefault()
  }}
  ...existing props
>
```

This is more robust than the existing `onOpenChange` guard alone, which has a timing issue — the lightbox `close` callback sets the ref to `false` before `onOpenChange` can check it. The existing `onOpenChange` guard stays for Escape key handling.

## Files to modify

- `src/components/productions/headshot-lightbox.tsx` — add `controller` prop
- `src/components/productions/submission-detail-sheet.tsx` — add `onInteractOutside` handler

## Verification

1. Open a role's submission board, click a candidate to open the Sheet
2. Click a headshot thumbnail to open the lightbox
3. Click the dark area around the photo — lightbox should close, Sheet should stay open
4. Verify X button still works
5. Verify Escape key closes lightbox first, then Sheet if pressed again
6. Test in the candidate detail page (non-Sheet context) — backdrop click should also close lightbox there
