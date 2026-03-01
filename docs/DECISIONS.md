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

**Context:** Public casting call pages (`/submit/[orgSlug]/[productionSlug]/[roleSlug]`) need clean, human-readable, shareable URLs. Auto-incremented database IDs (`/submit/42/17/3`) are opaque; UUIDs are long and unreadable.

**Decision:** Auto-generate slugs with an 8-character CUID suffix for collision resistance (e.g., `spring-musical-a1b2c3d4`). Uniqueness constraints are scoped: org slug is globally unique; production slug is unique per org; role slug is unique per production. Implementation in `src/lib/slug.ts`.

**Consequences:**
- Human-readable URLs improve shareability — a production team can share `/submit/riverside-theatre/spring-musical-2026/lead-role-k9m2x1y4` and candidates recognize the context
- CUID suffix avoids collision without sequential IDs, which would leak record counts
- Scoped uniqueness allows the same role name ("Understudy") across different productions without conflicts
- Trade-off: slugs are slightly longer than pure human-readable slugs due to the suffix; reserved slug list (`src/lib/slug.ts:RESERVED_SLUGS`) must be maintained as new routes are added

---

## ADR-007: Configurable Pipeline Stages per Role

**Context:** Casting workflows vary widely — a small community theatre might move candidates straight from Inbound to Cast/Rejected, while a larger production needs multiple callback rounds and specific evaluation stages. A fixed status enum would be too rigid.

**Decision:** Each role gets its own pipeline: 3 system stages (Inbound at position 0, Cast at 1000, Rejected at 1001) created automatically, with support for custom stages at positions 1–999 between them. System stages carry `isSystem: true` and cannot be removed. Stage transitions are recorded in the `StatusChange` table for a full audit trail. Implementation in `src/lib/pipeline.ts` and the `PipelineStage` schema.

**Consequences:**
- Mirrors the ATS pipeline model (Greenhouse/Lever pipelines) — familiar mental model for users
- Per-role pipelines support different evaluation depths within the same production (a lead role with three callback stages alongside an ensemble role with none)
- Terminal stages (`isTerminal: true`) prevent accidental status reversals on final decisions
- Position gap (1–999 for custom stages) avoids renumbering when inserting stages
- Trade-off: more complex data model than a simple status enum; UI must handle variable stage counts per role
