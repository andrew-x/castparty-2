---
description: Look up version-accurate documentation for a library or dependency
---

Look up the documentation for the library or API I'm asking about.

## Where to find docs

1. **Bundled references** — check `.claude/skills/dev-docs/references/` for pre-indexed
   docs covering: Next.js, shadcn/ui, Better Auth, Drizzle ORM, next-safe-action
2. **npm / official docs** — for libraries not in the bundled references, check the
   package's official documentation site or npm page
3. **`package.json`** — check the installed version before looking up docs to ensure
   version accuracy

## What to return

- The specific API, config option, or usage pattern I asked about
- A concise code example using the project's conventions (TypeScript, Bun, etc.)
- Any gotchas or version-specific behavior
- Link to the official docs page if available
