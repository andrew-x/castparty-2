# Branding Controls

## Context

Castparty's public-facing pages (`/s/[orgSlug]` and `/s/[orgSlug]/[productionSlug]`) currently show only text — no logos, banners, or images. The org description is plain text (max 500 chars). This makes casting calls look generic and unbranded. Adding visual branding lets community theatre orgs present a professional, recognizable identity to performers visiting their audition pages.

**Four changes:**
1. Upgrade org description from plain text to rich text (Tiptap)
2. Org logo upload (field exists in schema, no UI)
3. Production banner image upload (new schema field)
4. Role reference photos (new schema field, up to 3 per role)

**Decisions made:**
- Max 3 reference photos per role
- Temp paths + move on save (no orphaned files in R2)
- `next/image` for public pages (add R2 domain to `next.config.ts`)

---

## Phase 1: Database Schema + Migration

**Modify:** `src/lib/db/schema.ts`

- `Production` table (line 264): add `banner: text()` after `location`
- `Role` table (line 306): add `referencePhotos: jsonb().$type<string[]>().notNull().default([])` after `description`
- No changes to `organization` — `logo` field already exists (line 106)

**Run:** `bun drizzle-kit generate` then `bun drizzle-kit migrate`

---

## Phase 2: next/image Configuration

**Modify:** `next.config.ts`

Add `images.remotePatterns` for the R2 public domain (`R2_PUBLIC_URL` env var). The hostname is extracted at build time from `process.env.R2_PUBLIC_URL`.

---

## Phase 3: Presign Server Actions (temp paths)

Three new files, following the pattern in `src/actions/submissions/presign-headshot-upload.ts`. All use `secureActionClient`. All write to `temp/` paths. All return `{ key, presignedUrl, publicUrl }` so the client can show a preview and track the key.

| File | Folder in R2 | Max files | Max size |
|------|--------------|-----------|----------|
| `src/actions/organizations/presign-logo-upload.ts` | `temp/org-logos/` | 1 | 5 MB |
| `src/actions/productions/presign-banner-upload.ts` | `temp/production-banners/` | 1 | 10 MB |
| `src/actions/productions/presign-reference-photos-upload.ts` | `temp/role-reference-photos/` | up to 3 | 10 MB each |

MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic` (same as headshots).

---

## Phase 4: Reusable ImageUploader Component

**Create:** `src/components/common/image-uploader.tsx`

Two exports:

### `ImageUploader` (single image — logo, banner)
- Props: `value: string | null`, `onChange: (url: string | null, key: string | null) => void`, `presignAction`, `maxSizeMb`, `aspectHint?: string`, `label: string`
- Shows current image as `next/image` thumbnail if `value` is truthy
- Click triggers hidden file input → client-side validate MIME/size → call `presignAction` → `fetch(PUT)` to presigned URL → call `onChange(publicUrl, key)`
- Remove button → `onChange(null, null)`
- Loading spinner during upload

### `MultiImageUploader` (up to 3 — reference photos)
- Props: `value: { url: string; key: string }[]`, `onChange: (items: { url: string; key: string }[]) => void`, `presignAction`, `maxFiles: number`, `maxSizeMb: number`, `label: string`
- Grid of thumbnails with remove buttons
- Add button triggers multi-file input
- No drag-drop reorder (reference photos have no meaningful ordering)

Both components track the R2 key alongside the URL so the update actions know which temp keys to move to permanent storage.

---

## Phase 5: Validation Schema Updates

**Modify:** `src/lib/schemas/organization.ts`
- `updateOrgFormSchema.description`: change `z.string().trim().max(500)` → `z.string().max(10000)` (HTML; no trim — whitespace is structural)
- Add `logo: z.string().url().or(z.literal("")).nullable().optional()` to form + action schemas

**Modify:** `src/lib/schemas/production.ts`
- Add `banner: z.string().url().or(z.literal("")).nullable().optional()` to `updateProductionFormSchema` and `updateProductionActionSchema`

**Modify:** `src/lib/schemas/role.ts`
- Add `referencePhotos: z.array(z.string().url()).max(3).optional()` to `updateRoleFormSchema` and `updateRoleActionSchema`

---

## Phase 6: Update Server Actions (move from temp + cleanup)

**Modify:** `src/actions/organizations/update-organization.ts`
- Accept `logo` from input
- Fetch current org's `logo` before updating
- In transaction: set `logo` on `organization` table (call `moveFileByKey` first if it's a temp key)
- After transaction: `deleteFile(oldLogoUrl)` if logo changed and old was an R2 URL

**Modify:** `src/actions/productions/update-production.ts`
- Accept `banner` from input
- Same pattern: fetch old → move temp to `production-banners/` → update DB → delete old

**Modify:** `src/actions/productions/update-role.ts`
- Accept `referencePhotos` from input
- Fetch old `referencePhotos` array
- Move any temp keys to `role-reference-photos/`
- Update DB
- Compute removed URLs (old minus new) → `deleteFile` each

**Reuse:** `moveFileByKey` from `src/lib/r2.ts` for temp→permanent moves, `deleteFile` for cleanup.

---

## Phase 7: Settings Form UI

### Org settings form
**Modify:** `src/components/organizations/org-settings-form.tsx`
- Replace `Textarea` with `RichTextEditor` (import from `@/components/common/rich-text-editor`)
- Add `ImageUploader` for logo above the description field
- Add `currentLogo: string | null` to Props
- Add `logo` to defaultValues, hasChanges, action.execute

**Modify:** `src/app/(app)/settings/page.tsx`
- Pass `currentLogo` to the form

### Production settings form
**Modify:** `src/components/productions/production-settings-form.tsx`
- Add `ImageUploader` for banner after description, label "Banner image", aspectHint "16:9"
- Add `currentBanner: string | null` to Props
- Add `banner` to defaultValues, hasChanges, action.execute

**Modify:** `src/app/(app)/productions/[id]/(production)/settings/page.tsx`
- Pass `currentBanner` to the form

### Role settings form
**Modify:** `src/components/productions/role-settings-form.tsx`
- Add `MultiImageUploader` for reference photos after description
- Add `currentReferencePhotos: string[]` to Props
- Add `referencePhotos` to defaultValues, hasChanges (use `JSON.stringify` comparison), action.execute

**Modify:** `src/app/(app)/productions/[id]/(production)/roles/page.tsx`
- Include `referencePhotos` in the role mapping passed to `RolesManager`

**Modify:** `src/components/productions/roles-manager.tsx`
- Add `referencePhotos` to `RoleItem` interface, pass to `RoleSettingsForm`

---

## Phase 8: Public Page Data Actions

**Modify:** `src/actions/submissions/get-public-org.ts`
- Add `logo: true` to columns

**Modify:** `src/actions/submissions/get-public-production.ts`
- Add `banner: true` to production columns
- Add `referencePhotos: true` to roles columns

**Modify:** `src/actions/submissions/get-public-productions.ts`
- Add `referencePhotos: true` to roles columns

---

## Phase 9: Public Page Rendering

### Org listing page (`src/app/s/[orgSlug]/page.tsx`)
- **Logo:** Show `next/image` logo next to org name (fallback: keep existing icon/initial)
- **Rich text description:** Change `<p>{description}</p>` → `<div dangerouslySetInnerHTML={{ __html: sanitizeDescription(description) }}>` (import from `@/lib/sanitize`)
- **Role reference photos:** In role cards, show small thumbnail row if `role.referencePhotos` is non-empty

### Production submission page (`src/app/s/[orgSlug]/[productionSlug]/page.tsx`)
- **Banner:** If `production.banner` exists, render full-width `next/image` above the title with rounded corners
- **Role reference photos:** In accordion content for each role, render photo grid below description

---

## Subagents Used During Implementation

| Agent | Purpose |
|-------|---------|
| **ui-ux-engineer** | Build `ImageUploader` + `MultiImageUploader` components, update all settings forms |
| **general-purpose** | Schema changes, presign actions, update actions, data queries |
| **code-reviewer** | Post-implementation review |
| **librarian** | Update docs after feature is complete |

---

## Verification

1. `bun run build` — confirm no type errors
2. `bun run lint` — confirm no lint issues
3. **Org settings:** Visit `/settings` → see rich text editor for description, logo uploader → upload a logo → save → verify logo persists on refresh
4. **Production settings:** Visit production settings → see banner uploader → upload → save → verify
5. **Role settings:** Visit role settings → see reference photos uploader → upload 1-3 photos → save → verify
6. **Public org page:** Visit `/s/[orgSlug]` → verify logo, rich text description render
7. **Public production page:** Visit `/s/[orgSlug]/[productionSlug]` → verify banner, role reference photos render
8. **Replace/remove:** Replace a logo → verify old file deleted, new one shows. Remove all reference photos → verify cleanup
