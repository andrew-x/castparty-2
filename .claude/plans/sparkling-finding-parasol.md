# Plan: Add R2 file utility library

## Context

We need a server-side utility for managing files in Cloudflare R2 (S3-compatible storage). This will support uploading, deleting, and moving/copying files. The S3 SDK and cuid2 are already installed.

## Implementation

Create **`src/lib/r2.ts`** with:

### R2 client setup
- `S3Client` configured with `R2_ACCOUNT_ID` endpoint, `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` credentials
- Root folder based on `IS_DEV` from `src/lib/util.ts` (`dev` vs `prod`)
- Reuse `generateId` from `src/lib/util.ts` for unique filenames

### Exported functions

1. **`uploadFile(file: File, folder: string): Promise<string>`**
   - Generates key: `{root}/{folder}/{generateId("file")}.{ext}`
   - Uploads via `PutObjectCommand` with content type
   - Returns the full public URL

2. **`deleteFile(fileUrl: string): Promise<void>`**
   - Validates URL starts with `R2_PUBLIC_URL`
   - Extracts key and deletes via `DeleteObjectCommand`

3. **`moveFile(sourceUrl: string, destFolder: string): Promise<string>`**
   - Copies via `CopyObjectCommand` to new key in `destFolder`
   - Deletes the original via `DeleteObjectCommand`
   - Returns new public URL

4. **`getKeyFromUrl(fileUrl: string): string`**
   - Helper to strip `R2_PUBLIC_URL` prefix from a URL to get the object key

### Design decisions
- Use `folder` param instead of `userId` for flexibility (callers pass e.g. `uploads/${userId}` or `avatars`)
- No `"use server"` directives — this is a utility module, not a server action. Actions in `src/actions/` will call these functions.
- Move = copy + delete (R2/S3 has no native move)

### Files to modify
- **Create:** `src/lib/r2.ts`
- **Reuse:** `IS_DEV` and `generateId` from `src/lib/util.ts`

## Verification
- `bun run build` should succeed with no type errors
- `bun run lint` should pass
