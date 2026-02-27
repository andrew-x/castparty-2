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
