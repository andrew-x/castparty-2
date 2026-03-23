# Fix Better Auth Base URL Warning with Dynamic Port Detection

## Context

Better Auth logs a warning at startup because no `baseURL` is configured and `BETTER_AUTH_URL` is commented out in `.env`. The user runs multiple dev servers on different ports (3000, 3001, 3002, etc.), so hardcoding a URL isn't viable. We need the URL to resolve dynamically in dev while being explicitly set in production.

## Approach

Next.js sets `process.env.PORT` at runtime to the actual port the dev server is using (including auto-incremented ports). We'll use this for a dynamic fallback when no explicit URL is configured.

## Changes

### 1. Add `baseURL` to `betterAuth()` config — `src/lib/auth.ts`

Add the `baseURL` option that:
- Uses `BETTER_AUTH_URL` env var if set (production)
- Falls back to `http://localhost:${PORT}` using the Next.js-provided PORT (dev)
- Defaults to port 3000 if PORT isn't set either

```ts
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
  // ...existing config
})
```

### 2. Update `getAppUrl()` fallback — `src/lib/url.ts`

Currently hardcodes `http://localhost:3000` as fallback. Update to use `PORT` for consistency with the auth config:

```ts
export function getAppUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
  return `${base}${path}`
}
```

### 3. Clean up `.env` — uncomment `BETTER_AUTH_URL`

Remove the commented-out line since it's no longer needed in dev (dynamic detection handles it). Keep `.env.example` as-is since it documents the var for production use.

## Files Modified

- `src/lib/auth.ts` — add `baseURL` config option
- `src/lib/url.ts` — use dynamic PORT in fallback
- `.env` — remove commented-out `BETTER_AUTH_URL` line

## Verification

1. Run `bun dev` — confirm no Better Auth base URL warning in logs
2. Run `bun dev --port 3001` — confirm no warning and auth flows work on the alternate port
3. Run `bun run build` — confirm no build errors
