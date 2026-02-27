# Architecture

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | RSC-first, file-based routing, built-in optimizations |
| UI | React 19 | Latest concurrent features, RSC support |
| Language | TypeScript 5 | Type safety, IDE tooling, catch errors at compile time |
| Styling | Tailwind CSS v4 (PostCSS) | Utility-first, no runtime cost, v4 CSS-native config |
| Linting/Formatting | Biome 2 | Single tool replaces ESLint + Prettier, faster |
| Package Manager | Bun | Faster installs and scripts than npm/yarn/pnpm |
| Compiler | React Compiler (experimental) | Auto-memoization — skip manual useMemo/useCallback |

## Directory Layout

```
src/
└── app/
    ├── globals.css      # Tailwind import + theme tokens (CSS custom properties)
    ├── layout.tsx        # Root layout — fonts, <html>/<body> wrapper
    └── page.tsx          # Home route (/)
```

## Key Patterns

- **Server components by default** — only add `"use client"` when you need browser APIs or state.
- **React Compiler** — no manual `useMemo`, `useCallback`, or `React.memo`. The compiler handles it.
- **Path alias** — `@/*` maps to `./src/*` (configured in `tsconfig.json`).
- **Fonts** — Geist Sans + Geist Mono loaded via `next/font/google` in root layout. Exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`.
- **Theme tokens** — CSS custom properties in `globals.css` with `@theme inline` block for Tailwind integration. Dark mode via `prefers-color-scheme`.

## Data Flow

None yet — no API routes, database, or external services.

## External Services

None yet.
