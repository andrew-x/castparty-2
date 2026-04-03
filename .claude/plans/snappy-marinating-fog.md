# Submission Page Redesign — Implementation Plan

## Context

Redesigning the submission page (`/s/[orgSlug]/[productionSlug]`) from a single-column linear layout to a two-column layout with a sticky form sidebar on desktop and a floating CTA on mobile. Full design spec: `docs/superpowers/specs/2026-04-03-submission-page-redesign-design.md`.

## Step 1: Restructure page layout to two columns

**Agent:** Implementation (main agent or ui-ux-engineer)

**File:** `src/app/s/[orgSlug]/[productionSlug]/page.tsx`

Changes:
- Move banner above both columns (full-width)
- Add a two-column grid container (`md:grid md:grid-cols-[1fr_minmax(340px,_0.75fr)] md:gap-section`) below the banner
- Left column: production title, org credit line (with optional inline logo avatar), roles accordion
- Right column: `<div className="md:sticky md:top-4">` wrapping the `<SubmissionForm />`
- On mobile (<md), the grid collapses to a single column naturally
- Keep the no-roles empty state as full-width (outside the grid)

**Reuse:** Existing `Accordion`, `Image`, `Separator` components. Existing `getPublicOrg`, `getPublicProduction` queries.

## Step 2: Add collapsible production description

**Agent:** ui-ux-engineer or main agent

**File:** New client component `src/components/submissions/collapsible-description.tsx`

Changes:
- Create a `"use client"` component that accepts sanitized HTML
- Uses CSS `line-clamp-3` by default with a "Show more" button
- On click, removes the clamp and changes button to "Show less"
- Uses `useRef` + `useEffect` to detect whether clamping is needed (compare `scrollHeight` vs `clientHeight`) — if content fits in 3 lines, no toggle rendered
- If no description passed, renders nothing

**File:** Update `src/app/s/[orgSlug]/[productionSlug]/page.tsx` to use this component instead of the raw `dangerouslySetInnerHTML` div.

## Step 3: Polish roles accordion — static rows for empty roles

**Agent:** main agent

**File:** `src/app/s/[orgSlug]/[productionSlug]/page.tsx`

Changes:
- For roles with no description AND no reference photos: render as a plain styled row (not an accordion trigger/item) — just the role name in the same card-like styling
- For roles with content: keep as accordion items with polished card-like trigger styling
- This means the accordion only contains expandable items; non-expandable roles sit alongside as static elements

## Step 4: Wrap submission form in a card container with grouped sections

**Agent:** ui-ux-engineer

**File:** `src/components/submissions/submission-form.tsx`

Changes:
- Wrap entire form in a card container: `rounded-lg border bg-background p-6 shadow-sm` (or use existing Card component if one exists)
- Add heading "Submit your audition" (`font-serif text-heading`) and muted subtitle
- Group fields into named sections with section headings and `<Separator />` dividers between them:
  1. Roles (existing checkbox list)
  2. Contact info (first name, last name, email + conditional phone, location)
  3. Additional info (union status, representation) — only if any visible
  4. Materials (headshots, resume, video, links) — only if any visible
  5. Custom fields ("Additional questions") — only if any exist
  6. Submit button
- Each section conditionally renders; dividers only between rendered sections
- Reorder existing code: move custom fields section after materials section

## Step 5: Add mobile floating CTA

**Agent:** main agent

**File:** New client component `src/components/submissions/floating-apply-button.tsx`

Changes:
- `"use client"` component that renders a sticky bottom bar with "Apply now" button
- Only renders on mobile (`md:hidden`)
- Uses `IntersectionObserver` on a ref passed via prop (the form card element) to detect when the form is in view
- When form is visible: button fades out (`opacity-0 pointer-events-none` with transition)
- When form is not visible: button fades in
- On click: smooth-scrolls to the form card
- Styled: subtle top border, backdrop blur, page padding, full-width button

**File:** Update `src/app/s/[orgSlug]/[productionSlug]/page.tsx` to include this component and pass a ref/id to the form card for the observer.

## Step 6: Update page container width

**Agent:** main agent

**File:** `src/app/s/layout.tsx` or `src/app/s/[orgSlug]/[productionSlug]/page.tsx`

Changes:
- The current layout constrains to `max-w-page-content` (768px) which is too narrow for a two-column layout
- On the production page specifically, widen the container to accommodate two columns (e.g., `max-w-5xl` or ~1024px)
- Other submission routes (`/s/[orgSlug]`) should keep existing width
- This may mean moving the max-width from the layout to individual pages, or adding a wider variant on this specific page

## Verification

1. Visit `/s/{orgSlug}/{productionSlug}` on desktop (>768px): confirm two-column layout, sticky form card, full-width banner, collapsible description, polished roles accordion
2. Resize below 768px: confirm single column collapse, floating "Apply now" button appears, scrolls to form on tap, fades when form is visible
3. Test with a production that has: no banner, no description, roles with/without descriptions, roles with/without reference photos
4. Test with no roles — confirm empty state renders full-width
5. Test with minimal form (all optional fields hidden, no custom fields) — only roles + contact + submit
6. Test with maximal form (all fields visible, multiple custom fields) — sticky degrades gracefully
7. `bun run build` — no errors
8. `bun run lint` — no violations
