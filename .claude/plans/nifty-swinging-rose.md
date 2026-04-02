# Video Submission Field — Implementation Plan

## Context

Productions want performers to submit audition videos. Instead of hosting video files
(expensive), we store URLs to videos on YouTube, Vimeo, Google Drive, Dropbox, or custom
links. We render embeds inline when possible, and warn when we can't. This should feel
like a first-party feature despite linking to external hosts.

**Spec:** `docs/superpowers/specs/2026-03-31-video-submission-field-design.md`

## Implementation Steps

### Step 1: Data model + types

**Agent: general-purpose** — schema, types, and Zod schemas are tightly coupled; do them together.

**`src/lib/db/schema.ts`** — Add column to Submission table (after `links`):
```ts
videoUrls: text().array().notNull().default([]),
```

**`src/lib/types.ts`** — Add `video` to `SystemFieldConfig`:
- Add `video: SystemFieldVisibility` to the interface (after `resume`, before `links`)
- Add `video: "hidden"` to `DEFAULT_SYSTEM_FIELD_CONFIG`
- Add `video: "Video"` to `SYSTEM_FIELD_LABELS`
- Add `video: ["hidden", "optional", "required"]` to `SYSTEM_FIELD_ALLOWED_VISIBILITIES`

**`src/lib/schemas/form-fields.ts`** — Add `video` to `systemFieldConfigSchema`:
```ts
video: systemFieldVisibilitySchema,
```

**`src/lib/schemas/submission.ts`** — Add `videoUrls` to all relevant schemas:
- `submissionFormSchema`: add `videoUrls` with same preprocess pattern as `links`
- `submissionActionSchema`: inherits from `submissionFormSchema` (no change needed)
- `updateSubmissionFormSchema`: add `videoUrls` with same pattern
- `updateSubmissionActionSchema`: inherits (no change needed)

**`src/lib/submission-helpers.ts`** — Add `videoUrls: string[]` to `SubmissionWithCandidate` interface (after `links`).

**DB migration**: Run `bun drizzle-kit generate` to create migration, then `bun drizzle-kit push` or apply.

### Step 2: Video embed utility + component

**Agent: ui-ux-engineer** — two new files.

**`src/lib/video-embed.ts`** (new) — Pure utility for URL → embed detection:
```ts
interface VideoEmbedInfo {
  platform: "youtube" | "vimeo" | "google-drive" | "dropbox" | "unknown"
  embedUrl: string | null
}

export function getVideoEmbedInfo(url: string): VideoEmbedInfo
```

Platform detection rules:
- YouTube: match `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/` → `youtube.com/embed/{id}`
- Vimeo: match `vimeo.com/{id}` → `player.vimeo.com/video/{id}`
- Google Drive: match `drive.google.com/file/d/{id}` → `drive.google.com/file/d/{id}/preview`
- Dropbox: match `dropbox.com/` → replace `dl=0` with `raw=1`
- Unknown: return `{ platform: "unknown", embedUrl: null }`

**`src/components/submissions/video-embed.tsx`** (new) — Shared embed renderer:
- Props: `{ url: string; className?: string }`
- Calls `getVideoEmbedInfo(url)`
- If `embedUrl`: render iframe in 16:9 aspect ratio container (`aspect-video`) with `allow="autoplay; encrypted-media" allowFullScreen`
- If unknown: render styled link with `AlertTriangleIcon` warning — *"Preview not available — make sure this link is publicly accessible"*

### Step 3: VideoUrlEditor component

**Agent: ui-ux-engineer** — new form input component.

**`src/components/submissions/video-url-editor.tsx`** (new):
- Same interface as `LinksEditor`: `{ value: string[]; onChange: (urls: string[]) => void }`
- Same interaction pattern: add/remove URL inputs, auto-prepend `https://` on blur
- Below each URL input, render `VideoEmbed` preview if the URL is non-empty
- If `getVideoEmbedInfo` returns `unknown`, show inline warning:
  *"We couldn't preview this video. Make sure the link is publicly accessible (unlisted is fine)."*
- "Add video" button (instead of "Add link")
- Use `VideoIcon` from lucide-react as the icon prefix (instead of `SocialIcon`)

### Step 4: Wire into submission form (performer-facing)

**Agent: general-purpose**

**`src/components/submissions/submission-form.tsx`**:
- Import `VideoUrlEditor`
- Add `videoUrls: []` to `defaultValues`
- Add client-side validation for required video field (after resume check, ~line 204):
  ```ts
  if (systemFieldConfig.video === "required" && !form.getValues("videoUrls")?.length) {
    // set videoUrls error
  }
  ```
- Add Controller block for `videoUrls` — positioned after resume uploader, before links editor:
  ```tsx
  {systemFieldConfig.video !== "hidden" && (
    <Controller
      name="videoUrls"
      control={form.control}
      render={...}
    />
  )}
  ```
- Field label: "Video", description: "Link a video from YouTube, Vimeo, Google Drive, or Dropbox. You can also paste any direct video link."
- Required marker when `systemFieldConfig.video === "required"`

### Step 5: Wire into server actions

**Agent: general-purpose**

**`src/actions/submissions/create-submission.ts`**:
- Destructure `videoUrls` from `parsedInput` (~line 32)
- Add required validation (~line 107): `if (sfc.video === "required" && videoUrls.length === 0)`
- Pass `videoUrls` in the `Submission.insert` values (~line 255)

**`src/actions/submissions/update-submission.ts`**:
- Destructure `videoUrls` from `parsedInput` (~line 28)
- Pass `videoUrls` in the `Submission.update` set (~line 216)

### Step 6: Wire into submission display (casting director view)

**Agent: general-purpose**

**`src/actions/productions/get-production-submissions.ts`**:
- Add `videoUrls: sub.videoUrls` to the SubmissionWithCandidate object (~line 159, after `links`)

**`src/components/productions/submission-info-panel.tsx`**:
- Import `VideoEmbed`
- Add Videos section after resume, before links (~line 119):
  ```tsx
  {submission.videoUrls.length > 0 && (
    <>
      <Separator />
      <div className="flex flex-col gap-block">
        <h3 className="...">Videos</h3>
        <div className="flex flex-col gap-element">
          {submission.videoUrls.map((url) => (
            <VideoEmbed key={url} url={url} />
          ))}
        </div>
      </div>
    </>
  )}
  ```

**`src/components/productions/submission-edit-form.tsx`**:
- Import `VideoUrlEditor`
- Add `videoUrls: submission.videoUrls` to `defaultValues` (~line 63)
- Add Controller for `videoUrls` (after links editor, ~line 301):
  ```tsx
  <Controller
    name="videoUrls"
    control={form.control}
    render={({ field, fieldState }) => (
      <Field>
        <FieldLabel>Videos</FieldLabel>
        <VideoUrlEditor value={field.value ?? []} onChange={field.onChange} />
        {fieldState.error && <FieldError errors={[fieldState.error]} />}
      </Field>
    )}
  />
  ```

### Step 7: System field toggles

**No code changes needed.** The `SystemFieldToggles` component iterates `SYSTEM_FIELD_LABELS` and `SYSTEM_FIELD_ALLOWED_VISIBILITIES` automatically. Adding `video` to those constants (Step 1) is sufficient — the toggle row will appear automatically.

The `update-production-system-field-config.ts` action validates against `systemFieldConfigSchema`, which we update in Step 1. No action code changes needed.

### Step 8: Database migration

Run `bun drizzle-kit generate` to generate the migration for the new `videoUrls` column, then apply with `bun drizzle-kit push`.

## Files changed (summary)

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `videoUrls` column |
| `src/lib/types.ts` | Add `video` to SystemFieldConfig + constants |
| `src/lib/schemas/form-fields.ts` | Add `video` to systemFieldConfigSchema |
| `src/lib/schemas/submission.ts` | Add `videoUrls` to form + action schemas |
| `src/lib/submission-helpers.ts` | Add `videoUrls` to SubmissionWithCandidate |
| `src/lib/video-embed.ts` | **New** — embed URL detection utility |
| `src/components/submissions/video-embed.tsx` | **New** — shared embed component |
| `src/components/submissions/video-url-editor.tsx` | **New** — multi-URL input with previews |
| `src/components/submissions/submission-form.tsx` | Add video field + validation |
| `src/actions/submissions/create-submission.ts` | Handle videoUrls |
| `src/actions/submissions/update-submission.ts` | Handle videoUrls |
| `src/actions/productions/get-production-submissions.ts` | Map videoUrls |
| `src/components/productions/submission-info-panel.tsx` | Render video embeds |
| `src/components/productions/submission-edit-form.tsx` | Add video editor |

## Execution strategy

Use **subagent-driven development** with 3 parallel agents:

1. **Agent A** (Steps 1 + 8): Data model, types, schemas, migration
2. **Agent B** (Steps 2 + 3): VideoEmbed utility, VideoEmbed component, VideoUrlEditor component
3. **Agent C** (Steps 4 + 5 + 6): Wire into form, actions, and display components (blocked on A + B)

Agent C starts after A and B complete since it imports the new types and components.

## Verification

1. `bun run build` — passes with no type errors
2. Toggle video field visibility in production settings → confirms toggle appears and persists
3. Submit with YouTube, Vimeo, Google Drive, Dropbox, and random URLs → embeds render for known platforms, warnings for unknown
4. Open submission drawer → video embeds display inline and are playable
5. Set video to required → submit without video → validation error shows
6. Edit submission → videoUrls are editable
