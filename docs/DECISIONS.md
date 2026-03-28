# Architecture Decision Records

Format: **Context** → **Decision** → **Consequences**

---

## ADR-001: Biome over ESLint + Prettier

**Context:** Need linting and formatting. ESLint + Prettier is the standard combo but requires two tools, config alignment, and slower execution.

**Decision:** Use Biome as a single tool for both linting and formatting.

**Consequences:**
- One config file (`biome.json`) instead of two
- Significantly faster — Biome is written in Rust
- Biome has React and Next.js domain rules built in
- Trade-off: smaller plugin ecosystem than ESLint (no custom rules from community)

---

## ADR-002: Bun over npm/yarn/pnpm

**Context:** Need a package manager and script runner. Bun offers faster installs and script execution.

**Decision:** Use Bun as the sole package manager and script runner.

**Consequences:**
- Faster `install` and `run` commands
- Binary lockfile (`bun.lock`) — not human-readable, but smaller
- Some npm packages with native add-ons may need `trustedDependencies` config
- Team must have Bun installed (not bundled with Node.js)

---

## ADR-003: Tailwind CSS v4 over CSS Modules / styled-components

**Context:** Need a styling approach. Options: Tailwind (utility-first), CSS Modules (scoped CSS), styled-components (CSS-in-JS).

**Decision:** Use Tailwind CSS v4 via PostCSS.

**Consequences:**
- No runtime CSS cost (unlike styled-components)
- v4 uses native CSS features (`@theme inline`, CSS custom properties) instead of JS config
- Biome enforces sorted classes for consistency
- Trade-off: long class strings in markup (mitigated by component extraction)

---

## ADR-004: React Compiler (experimental)

**Context:** React 19 ships with an opt-in compiler that auto-memoizes components and hooks, eliminating manual `useMemo`/`useCallback`/`React.memo`.

**Decision:** Enable React Compiler via `babel-plugin-react-compiler` and `reactCompiler: true` in `next.config.ts`.

**Consequences:**
- No manual memoization needed — compiler handles it
- Smaller, cleaner component code
- Trade-off: experimental status means potential edge-case bugs
- If issues arise, can disable per-file with `"use no memo"` directive

---

## ADR-005: Semantic Design Token System (Violet+Stone)

**Context:** Needed a consistent visual language across all components without coupling component code to specific color values (e.g., `violet-600`). Raw Tailwind palette classes make theme changes require a codebase-wide find-and-replace.

**Decision:** Define all colors as CSS custom properties in a single `@theme inline` block in `src/styles/globals.scss`, using semantic names (`--color-brand`, `--color-cta`, `--color-success`, etc.) rather than raw palette values. Tailwind v4's `@theme inline` generates utility classes directly from these tokens.

**Consequences:**
- Component code stays decoupled from specific color choices — changing a brand color means updating one token value, not hundreds of class names
- Token names encode intent (`bg-brand-subtle` for nav hover tint, `bg-success-light` for badge backgrounds) rather than raw color values
- Tailwind v4's CSS-native config means no `tailwind.config.js` file needed — tokens are defined once in CSS
- Trade-off: developers must learn the token vocabulary rather than reaching for standard Tailwind palette classes

---

## ADR-006: URL Slug System for Public Routes

**Context:** Public casting call pages (`/s/[orgSlug]/[productionSlug]/[roleSlug]`) need clean, human-readable, shareable URLs. Auto-incremented database IDs (`/s/42/17/3`) are opaque; UUIDs are long and unreadable.

**Decision:** Auto-generate slugs with an 8-character CUID suffix for collision resistance (e.g., `spring-musical-a1b2c3d4`). Uniqueness constraints are scoped: org slug is globally unique; production slug is unique per org; role slug is unique per production. Implementation in `src/lib/slug.ts`.

**Consequences:**
- Human-readable URLs improve shareability — a production team can share `/s/riverside-theatre/spring-musical-2026/lead-role-k9m2x1y4` and candidates recognize the context
- CUID suffix avoids collision without sequential IDs, which would leak record counts
- Scoped uniqueness allows the same role name ("Understudy") across different productions without conflicts
- Trade-off: slugs are slightly longer than pure human-readable slugs due to the suffix; reserved slug list (`src/lib/slug.ts:RESERVED_SLUGS`) must be maintained as new routes are added

---

## ADR-007: Configurable Pipeline Stages at the Production Level

**Context:** Casting workflows vary widely — a small community theatre might move candidates straight from Applied to Selected/Rejected, while a larger production needs multiple callback rounds and specific evaluation stages. A fixed status enum would be too rigid.

**Decision:** Each production has one shared pipeline: 3 system stages (Applied at order 0, Selected at 1000, Rejected at 1001) created automatically, with support for custom stages at orders 1–999 between them. Stage identity is captured by a `type` enum (`APPLIED`, `SELECTED`, `REJECTED`, `CUSTOM`) rather than boolean flags — this removes the need for separate `isSystem`/`isTerminal` columns. Non-`CUSTOM` stages are protected from removal. Stage transitions are recorded in the `PipelineUpdate` table for a full audit trail. Implementation in `src/lib/pipeline.ts` and the `PipelineStage` schema.

All roles in a production share the same pipeline — there is no per-role pipeline override. The `PipelineStage` table has no `roleId` column.

**Earlier design (removed 2026-03-22):** An earlier version used a two-tier design: a production-level template pipeline (`PipelineStage` rows with `roleId = null`) that new roles inherited, plus per-role pipeline overrides. This was removed because it caused configuration confusion — directors had to manage the same pipeline in multiple places, and the per-role override was almost never used differently from the production template.

**Consequences:**
- Mirrors the ATS pipeline model (Greenhouse/Lever pipelines) — familiar mental model for users
- A single production-level pipeline eliminates per-role configuration overhead
- `type` enum replaces dual boolean flags (`isSystem`, `isTerminal`) — a single value encodes both the semantic role and removal protection
- Order gap (1–999 for custom stages) avoids renumbering when inserting stages
- Terminal stages do not block status reversals — casting directors can correct mistakes freely. The full `PipelineUpdate` audit trail provides accountability without blocking corrections.
- Trade-off: all roles in a production must share the same pipeline structure; a production needing different stage depths per role would require separate productions

---

## ADR-009: Auth schemas use bare `"zod"`, excluded from the schemas barrel

**Context:** `src/lib/schemas/auth.ts` defines the Zod schemas for the auth forms (`signUpSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`). These were consolidated from inline definitions in the form components. The rest of the codebase uses `"zod/v4"` as the canonical import. Better Auth's hookform resolver adapter expects the unversioned `"zod"` import — using `"zod/v4"` causes a type mismatch at the resolver boundary.

**Decision:** Auth schemas import from bare `"zod"` and are intentionally not re-exported from `src/lib/schemas/index.ts`. This prevents the `"zod"` and `"zod/v4"` namespaces from being mixed in downstream consumers that import from the barrel.

**Consequences:**
- Auth form components import directly from `@/lib/schemas/auth` — never from the barrel
- The barrel (`src/lib/schemas/index.ts`) is safe to import anywhere without pulling in mixed Zod versions
- Maintainers must be aware of this exception; the barrel omission is a signal, not an oversight
- If Better Auth's adapter is updated to support `"zod/v4"`, auth schemas can be migrated and added to the barrel

---

## ADR-010: Svix for Resend webhook signature verification

**Context:** The Resend inbound email webhook endpoint (`POST /api/webhooks/resend`) must reject spoofed requests — without verification, anyone who knows the URL could inject arbitrary inbound email records. Resend delivers webhooks via Svix and signs every request with `svix-id`, `svix-timestamp`, and `svix-signature` headers.

**Decision:** Use the `svix` npm package to verify webhook signatures. The single call `new Webhook(secret).verify(rawBody, headers)` handles signature validation, timestamp freshness checking, and payload parsing. The raw request body (not the parsed JSON) is required for HMAC verification, so `req.text()` is called before any other body parsing.

**Consequences:**
- Signature verification is a one-liner; no custom HMAC implementation needed
- Replay attacks are blocked by Svix's timestamp freshness window
- The `svix` package is a direct dependency alongside Resend — both are from the same vendor, so their versioning is aligned
- If Resend ever moves away from Svix, the verification library would need to change, but the endpoint structure would not

---

## ADR-008: `unpdf` over `pdf-parse` for server-side PDF text extraction

**Context:** Resume upload requires extracting the text content of a PDF file server-side so it can be stored in `Submission.resumeText` for future search or AI screening. `pdf-parse` is the most common Node.js PDF extraction library, but it references `pdf-parse/build/pdf.worker.entry.js` at module load time — a path that the Next.js bundler cannot resolve in a serverless/edge context, causing a build error.

**Decision:** Use `unpdf` (v0.x) instead. `unpdf` wraps `pdfjs-dist` with a zero-dependency, serverless-compatible API (`getDocumentProxy` + `extractText`). It has no worker file resolution requirement and no bundler workarounds needed.

**Consequences:**
- PDF text extraction works without any Next.js bundler config exceptions
- `unpdf` API is minimal: `getDocumentProxy(Uint8Array)` → `extractText(pdf, { mergePages: true })` → `{ text: string }` — straightforward to use
- Text extraction is best-effort (wrapped in try/catch in `create-submission`): if `unpdf` fails on a malformed PDF, `Submission.resumeText` stays `null` and the submission succeeds
- Trade-off: `unpdf` is a smaller, less battle-tested library than `pdf-parse`; extraction quality on complex PDFs may differ
