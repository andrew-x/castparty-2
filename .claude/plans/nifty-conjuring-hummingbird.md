# Plan: Comparison View Headshot Navigation

## Context

In the comparison view, the hero headshot currently shows only the first photo (`s.headshots[0]`) with no way to cycle through other headshots without opening the fullscreen lightbox. The user wants inline prev/next navigation on the hero image and a visual indicator in the thumbnail gallery showing which photo is selected.

## Changes

**Single file:** `src/components/productions/comparison-view.tsx`

### 1. Track selected headshot index per submission

Add a state map from submission ID → selected headshot index:

```ts
const [selectedHeadshotIndex, setSelectedHeadshotIndex] = useState<Record<string, number>>({})
```

Helper to get current index for a submission (defaults to 0):

```ts
const getHeadshotIndex = (submissionId: string) => selectedHeadshotIndex[submissionId] ?? 0
```

### 2. Add prev/next buttons to the hero headshot (lines 144-180)

- Change `s.headshots[0]?.url` to use `s.headshots[getHeadshotIndex(s.id)]?.url`
- Overlay prev/next `ChevronLeftIcon`/`ChevronRightIcon` buttons on left/right edges of the hero image
- Only show buttons when the submission has more than 1 headshot
- Hide prev when at index 0, hide next when at last index
- Buttons use `bg-background/80 backdrop-blur-sm` styling (matches existing remove button)

### 3. Add selected indicator to thumbnail gallery (lines 229-264)

- Change the thumbnail button's border class: if the thumbnail's index matches the selected hero index, use `ring-2 ring-primary` (or similar highlight); otherwise keep the existing `border border-border`
- Clicking a thumbnail now also updates the hero (sets selected index) in addition to opening the lightbox — or better: clicking sets the hero, and the lightbox is triggered separately. Actually, keep the existing click-to-lightbox behavior but add the selection indicator so the user can see which thumbnail corresponds to the hero.

**Revised approach for thumbnails:** Clicking a thumbnail still opens the lightbox (existing behavior). The indicator simply highlights whichever thumbnail matches the current hero index. The hero index changes via the prev/next buttons on the hero image.

### 4. Import `ChevronLeftIcon` and `ChevronRightIcon` from lucide-react

Add to the existing lucide import at line 3.

### 5. Contain hero headshot instead of cropping

**File:** `src/components/productions/comparison-view.tsx` (line 167)

Change the hero `<img>` from `object-cover` to `object-contain` so the full headshot is visible. The existing `bg-muted` on the container already provides the letterbox fill color.

```diff
- className="size-full object-cover"
+ className="size-full object-contain"
```

## Verification

1. Run `bun run build` to check for type errors
2. Open the comparison view with candidates that have multiple headshots
3. Verify prev/next buttons appear on the hero and cycle through photos
4. Verify the thumbnail gallery highlights the currently-displayed photo
5. Verify lightbox still opens when clicking thumbnails
6. Verify candidates with 0 or 1 headshot show no nav buttons
7. Verify hero headshots are fully visible (not cropped) with muted background fill on empty space
