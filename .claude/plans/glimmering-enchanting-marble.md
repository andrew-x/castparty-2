# Plan: Add Links Field to Submissions

## Context

Candidates submitting auditions need a way to share their portfolio, social media profiles, and demo reel URLs. Currently the submission form only collects contact info, headshots, resume, and custom form answers. Adding a `links` field lets candidates share relevant URLs (Instagram, TikTok, YouTube, personal sites), and the reviewer sees them with recognizable brand icons.

## Design Decisions

1. **No new dependency** — use inline SVG components for brand icons instead of adding `react-icons`. Only ~8 icons are needed, and the project exclusively uses `lucide-react`. Each icon is ~5 lines of SVG.

2. **`text[]` column** — store links as `text().array()` since it's a simple string list. More idiomatic PostgreSQL than `jsonb` for flat arrays.

3. **React Hook Form field** — links are simple strings (no async uploads like headshots), so they belong in the form schema, not local state. Validation flows through Zod automatically.

4. **Auto-prepend `https://`** — the `LinksEditor` component will prepend `https://` on blur if the user omits the protocol, improving UX without relaxing Zod's `.url()` validation.

5. **Filter empty strings** — use `z.preprocess` to strip empty strings from the array before validation, so users can add a row and leave it blank without triggering errors.

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/schemas/submission.ts` | Add `links` to `submissionFormSchema` |
| `src/lib/db/schema.ts` | Add `links` jsonb column to `Submission` table |
| `src/actions/submissions/create-submission.ts` | Destructure and insert `links` |
| `src/actions/productions/get-role-with-submissions.ts` | Pass `links` through in transform |
| `src/lib/submission-helpers.ts` | Add `links: string[]` to `SubmissionWithCandidate` |
| `src/components/submissions/submission-form.tsx` | Add `LinksEditor` via `Controller` |
| `src/components/productions/submission-detail-sheet.tsx` | Display links with brand icons |

## New Files

| File | Purpose |
|------|---------|
| `src/lib/social-links.ts` | `detectPlatform()`, platform metadata, `prettifyUrl()` |
| `src/components/common/social-icons.tsx` | Brand SVG icon components + `SocialIcon` wrapper |
| `src/components/submissions/links-editor.tsx` | Controlled input list for adding/removing URLs |

## Implementation Steps

### Step 1: Zod Schemas
**File:** `src/lib/schemas/submission.ts`

Add to `submissionFormSchema`:
```ts
links: z.preprocess(
  (val) => (Array.isArray(val) ? val.filter((v) => typeof v === "string" && v.trim()) : []),
  z.array(z.string().trim().url("Enter a valid URL."))
).default([]),
```

No change to `submissionActionSchema` — it inherits `links` from `.extend()`.

### Step 2: Database Schema
**File:** `src/lib/db/schema.ts`

Add after the `answers` column on `Submission`:
```ts
links: text().array().notNull().default([]),
```

Then run `bun run db:update` to generate and apply the migration.

### Step 3: Create Action
**File:** `src/actions/submissions/create-submission.ts`

- Add `links` to the destructured `parsedInput` (line ~29)
- Add `links` to the `db.insert(Submission).values({...})` call (line ~169)

### Step 4: Type Interface
**File:** `src/lib/submission-helpers.ts`

Add to `SubmissionWithCandidate`:
```ts
links: string[]
```

### Step 5: Query Transform
**File:** `src/actions/productions/get-role-with-submissions.ts`

Add `links: sub.links` to the returned object in the `.map()` (line ~73).

### Step 6: Social Link Utilities
**New file:** `src/lib/social-links.ts`

- `detectPlatform(url: string)` — returns platform key by hostname matching
- `PLATFORM_META` — map of platform key to display name
- `prettifyUrl(url: string)` — strips protocol + trailing slash for display

Supported platforms: Instagram, TikTok, YouTube, Vimeo, X (Twitter), Facebook, LinkedIn, Spotify

### Step 7: Brand Icon Components
**New file:** `src/components/common/social-icons.tsx`

- Inline SVG components for each platform (CC0-licensed Simple Icons paths)
- `SocialIcon` wrapper: takes a `url` prop, detects platform, renders the right icon
- Falls back to lucide's `LinkIcon` for unrecognized URLs
- Accepts `className` prop following the `lucide-react` pattern

### Step 8: Links Editor Component
**New file:** `src/components/submissions/links-editor.tsx`

Follows the `OptionsEditor` pattern from `form-fields-editor.tsx`:
- Props: `value: string[]`, `onChange: (links: string[]) => void`
- Each link row: detected platform icon + `<Input type="url">` + remove button
- "Add link" button appends empty string
- On blur: auto-prepend `https://` if no protocol present
- Uses `gap-element` spacing, common components only

### Step 9: Integrate into Submission Form
**File:** `src/components/submissions/submission-form.tsx`

- Add `links: []` to `defaultValues` (line ~83)
- Add `Controller` for `links` field after the Resume uploader (line ~516)
- Wraps `LinksEditor` in `<Field>` with label "Links (optional)" and description "Add links to your portfolio, social media, or demo reels."
- No change to `action.execute()` — `...v` already spreads all form values

### Step 10: Display in Submission Detail Sheet
**File:** `src/components/productions/submission-detail-sheet.tsx`

Add a new section after Resume, before Submitted date:
- Only renders if `submission.links.length > 0`
- Each link renders as clickable `<a>` with `SocialIcon` + prettified URL
- Matches existing section styling (separator, h3 heading, gap-block/gap-element)
- Links open in new tab with `rel="noopener noreferrer"`

## Verification

1. **Build** — `bun run build` should pass with no type errors
2. **Lint** — `bun run lint` should pass
3. **Migration** — `bun run db:update` should generate and apply clean migration
4. **Manual test (form):**
   - Visit a submission page `/s/[org]/[prod]/[role]`
   - Add 2-3 links (mix of social media and generic URLs)
   - Verify brand icons appear next to recognized URLs
   - Submit and confirm success
5. **Manual test (viewer):**
   - Open a submission in the detail sheet
   - Verify links section appears with correct brand icons
   - Click a link — should open in new tab
6. **Edge cases:**
   - Submit with no links — should work (optional field)
   - Add a link row, leave it blank, submit — should be filtered out
   - Paste URL without `https://` — should auto-prepend on blur

## Subagents for Implementation

- **Parallel agent group 1:** Schema + DB changes (steps 1-2), Social link utilities (step 6), Brand icons (step 7)
- **Parallel agent group 2:** Backend changes (steps 3-5), Links editor component (step 8)
- **Sequential:** Form integration (step 9), Viewer integration (step 10) — depend on prior steps
- **Code reviewer agent** after all changes are complete
- **Librarian agent** to update docs after feature is done
