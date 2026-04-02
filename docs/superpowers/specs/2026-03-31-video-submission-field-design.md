# Video Submission Field

## Context

Productions often want performers to submit audition videos (monologues, songs, dance
reels). Hosting video is expensive. Instead of uploading files, we store URLs to videos
hosted on YouTube, Vimeo, Google Drive, Dropbox, or any custom link. The feature should
feel first-party — embed previews inline when possible, warn gracefully when not.

## Data Model

### Submission table

New column:

```
videoUrls: text().array().notNull().default([])
```

### SystemFieldConfig

New key:

```ts
video: SystemFieldVisibility  // "hidden" | "optional" | "required"
```

Default visibility: `"hidden"` (opt-in by casting directors).

Supports full visibility range (hidden/optional/required), same as phone, location,
headshots, and resume.

### Validation

Each URL validated with `z.string().trim().url()`. Empty strings filtered out before
validation (same preprocess pattern as `links`).

### No new tables

The existing `VIDEO` file type enum in the `File` table is unrelated (for actual file
uploads). This feature stores URLs directly on the Submission row.

## Embed Detection (VideoEmbed component)

A shared `VideoEmbed` component that accepts a URL, detects the platform, and renders
an iframe embed or a fallback link.

### Platform detection

| Platform     | URL patterns                                          | Embed URL                                    |
|--------------|-------------------------------------------------------|----------------------------------------------|
| YouTube      | `youtube.com/watch?v={id}`, `youtu.be/{id}`, `youtube.com/shorts/{id}` | `youtube.com/embed/{id}`            |
| Vimeo        | `vimeo.com/{id}`                                      | `player.vimeo.com/video/{id}`                |
| Google Drive | `drive.google.com/file/d/{id}`                        | `drive.google.com/file/d/{id}/preview`       |
| Dropbox      | `dropbox.com/...`                                     | Replace `dl=0` with `raw=1`, render in iframe |
| Unknown      | anything else                                         | No embed — show clickable link with warning  |

Detection is a pure function (`getVideoEmbedUrl(url: string): { platform: string; embedUrl: string | null }`).
Runs client-side at render time — no need to store platform metadata.

### Embed rendering

- Iframe with `allow="autoplay; encrypted-media"` and `allowfullscreen`
- 16:9 aspect ratio container
- For unknown URLs: render a styled link with a small warning icon and text:
  *"Preview not available — make sure this link is publicly accessible"*

## Performer-Facing Form (VideoUrlEditor)

### Position in form

After resume uploader, before links editor. Videos are higher priority than generic
portfolio links.

### Field chrome

- Label: **"Video"**
- Description: *"Link a video from YouTube, Vimeo, Google Drive, or Dropbox. You can also paste any direct video link."*
- Required/optional badge follows existing system field pattern
- Visibility controlled by `systemFieldConfig.video`

### Input behavior

- Multiple URL inputs (add/remove), same interaction pattern as `LinksEditor`
- Auto-prepend `https://` on blur (same as links)
- After entering a URL, show inline embed preview below the input using `VideoEmbed`
- If embed detection fails: show warning banner —
  *"We couldn't preview this video. Make sure the link is publicly accessible (unlisted is fine)."*
  — but still allow submission (the URL is stored regardless)

## Casting Director View (SubmissionInfoPanel)

### Position

New **"Videos"** section after resume and before links.

### Rendering

- Each video URL rendered via `VideoEmbed` (playable inline)
- If embed not possible, show as clickable link with warning that preview isn't available
- Only shown when `systemFieldConfig.video !== "hidden"`

## System Field Configuration (SystemFieldToggles)

- New toggle row: **"Video"**
- Options: Hidden / Optional / Required (full `SystemFieldVisibility`)
- Default: `"hidden"`
- Position in toggle list: after resume, before links

## Files to modify

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `videoUrls` column to Submission table |
| `src/lib/types.ts` | Add `video` to `SystemFieldConfig`, update labels and allowed visibilities |
| `src/lib/schemas/form-fields.ts` | Update `systemFieldConfigSchema` with `video` key |
| `src/lib/schemas/submission.ts` | Add `videoUrls` validation to submission schema |
| `src/actions/submissions/create-submission.ts` | Handle `videoUrls` in submission creation |
| `src/actions/submissions/update-submission.ts` | Handle `videoUrls` in submission update |
| `src/components/submissions/video-url-editor.tsx` | **New** — multiple URL input with embed preview |
| `src/components/submissions/video-embed.tsx` | **New** — shared embed component with platform detection |
| `src/components/submissions/submission-form.tsx` | Add `VideoUrlEditor` after resume, before links |
| `src/components/productions/submission-info-panel.tsx` | Add Videos section with `VideoEmbed` |
| `src/components/productions/system-field-toggles.tsx` | Add Video toggle row |
| `src/actions/productions/update-production-system-field-config.ts` | Accept `video` in config update |
| DB migration | Add `videoUrls` column |

## Verification

1. **System field config**: Toggle video between hidden/optional/required in production settings. Confirm it persists and the form reflects the setting.
2. **Form input**: Paste YouTube, Vimeo, Google Drive, Dropbox, and random URLs. Confirm embeds render for known platforms and warnings show for unknown.
3. **Submission creation**: Submit with video URLs. Confirm they're stored and retrievable.
4. **Submission detail**: Open the submission drawer. Confirm embeds render inline and are playable.
5. **Required validation**: Set video to required, try submitting without a video URL. Confirm validation error.
6. **Build**: `bun run build` passes with no errors.
