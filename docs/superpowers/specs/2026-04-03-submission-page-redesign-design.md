# Submission Page Redesign

## Context

The current submission page (`/s/[orgSlug]/[productionSlug]`) renders everything in a single linear column: banner, production info, roles accordion, separator, then the full submission form. This creates a disconnect between browsing casting notice details and filling out the form. Returning candidates must scroll past all the production context to reach the form, while newcomers see the form and context as separate, disconnected sections.

The redesign introduces a two-column layout that keeps the casting notice and submission form side by side on desktop, with a mobile-optimized single column layout that includes a floating CTA to reduce friction.

## Design Decisions

### Two-Column Layout (Desktop)

**Left column (~55-60%):** Production context — production title, org credit, collapsible description, roles accordion.

**Right column (~40-45%):** Submission form in a contained card with sticky positioning.

**Banner:** Spans the full width above both columns. Same treatment as current — `aspect-video`, `object-cover`, `rounded-lg`. Conditionally rendered only if `production.banner` exists. No placeholder when missing.

**Breakpoint:** `md` (768px). Below this, collapses to single column.

### Left Column — Production Context

**Production header:**
- Production name: `font-serif text-title`
- Org credit line: "by {org.name}" in `text-caption text-muted-foreground`. If org has a logo, show a tiny inline avatar (16-20px) next to the org name. No logo = just text. No separate org section.

**Production description:** Collapsible with CSS `line-clamp` (3 lines preview) and a "Show more" / "Show less" toggle. If description is short enough (under ~3 lines), no toggle needed. If no description, nothing renders.

**Roles accordion:** Radix accordion, `type="multiple"`. Each trigger is a card-like row with the role name. Expanded content shows sanitized description + reference photo thumbnails. Roles with no description AND no photos render as a static row (no chevron, nothing to expand).

### Right Column — Form Card

**Container:** White background, subtle border, slight shadow, `rounded-lg`. Heading: "Submit your audition" (`font-serif text-heading`), muted subtitle below.

**Sticky behavior:** `position: sticky; top: 1rem` on the right column wrapper. When the form is taller than the viewport, the sticky positioning naturally stops working and the form scrolls with the page. No dual-scroll. No special handling.

**Form sections inside the card, separated by light dividers:**

1. **Roles** — checkbox list with required marker. Scrollable if many roles (`max-h-[280px] overflow-y-auto`).
2. **Contact info** — first name + last name (side by side), email, then conditional system fields (phone, location) based on `systemFieldConfig`.
3. **Additional info** — conditional: union status, representation toggle. Only renders if any are not `hidden`.
4. **Materials** — conditional: headshots, resume, video URL, links. Only renders if any are not `hidden`.
5. **Custom fields** — dynamically rendered from `submissionFormFields` using `CustomFieldDisplay`. Section heading: "Additional questions". Only renders if custom fields exist.
6. **Submit button** — full-width. Dynamic label: "Submit for N roles" / "Submit" / "Uploading files..."

Each section only renders if it has visible content. Dividers only appear between rendered sections.

### Mobile Experience

**Layout:** Single column below `md` breakpoint. Content order: banner, production title + org credit, collapsible description, roles accordion, form card.

**Floating CTA:** Sticky button fixed to the bottom of the viewport — "Apply now". Smooth-scrolls to the form card on tap. Uses `IntersectionObserver`: when the form enters the viewport, the button fades out; when the form leaves, the button fades back in. Styled with subtle top border and background blur. Full-width within page padding.

**No floating CTA on desktop** — the sticky sidebar makes it unnecessary.

### Edge Cases

- **No banner:** Two-column layout starts directly with the production header.
- **No description:** Credit line sits under the title, then roles accordion. No gap.
- **No roles:** Full-width empty state, no form rendered. Same as current.
- **Role with no description/photos:** Static row, no expand trigger. Just the role name.
- **All optional system fields hidden:** Those sections don't render. Dividers only between rendered sections.
- **No custom fields:** "Additional questions" section doesn't render.
- **Very long form:** Sticky behavior degrades gracefully — form scrolls normally.
- **Single role:** Role checkbox list still shows with one item.

## Files to Modify

- `src/app/s/[orgSlug]/[productionSlug]/page.tsx` — restructure to two-column layout, add banner full-width, add collapsible description, handle role static rows
- `src/components/submissions/submission-form.tsx` — wrap in card container, regroup form sections with dividers, reorder sections (move custom fields after materials)
- `src/app/s/[orgSlug]/[productionSlug]/page.tsx` or new client component — add mobile floating CTA with IntersectionObserver logic

## Files to Reuse

- `src/components/common/accordion.tsx` — existing accordion for roles
- `src/components/submissions/custom-field-display.tsx` — existing custom field renderer
- `src/components/submissions/headshot-uploader.tsx` — existing headshot uploader
- `src/components/submissions/resume-uploader.tsx` — existing resume uploader
- `src/components/submissions/video-embed.tsx` — existing video embed
- `src/components/submissions/links-editor.tsx` — existing links editor
- `src/components/submissions/representation-fields.tsx` — existing representation fields
- `src/components/submissions/union-status-select.tsx` — existing union multi-select
- `src/components/common/button.tsx` — for floating CTA and submit button
- `src/lib/sanitize.ts` — `sanitizeDescription` for HTML content

## Verification

1. Visit `/s/{orgSlug}/{productionSlug}` on desktop (>768px): confirm two-column layout, sticky form card, full-width banner, collapsible description, polished roles accordion
2. Resize below 768px: confirm single column collapse, floating "Apply now" button appears, scrolls to form on tap, fades when form is visible
3. Test with a production that has: no banner, no description, roles with/without descriptions, roles with/without reference photos — confirm no visual gaps or broken layout
4. Test with a production that has no roles — confirm empty state renders full-width
5. Test with a minimal form (all optional fields hidden, no custom fields) — confirm form card shows only roles, contact info, submit
6. Test with a maximal form (all fields visible, multiple custom fields) — confirm form degrades from sticky to scrolling gracefully
7. Run `bun run build` to confirm no build errors
8. Run `bun run lint` to confirm no lint violations
