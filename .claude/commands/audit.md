# Codebase Audit

Full-codebase quality audit with documentation sync. Checks every convention, rule,
and best practice across 6 domains, then updates docs via the librarian.

You are an orchestrator. You do NOT read source files directly — you spawn subagents
for that. Your job is to gather baseline data, dispatch domain audits, synthesize
findings, trigger a librarian update, and present a unified report.

## Phase 1: Inventory

Run these commands and note the results (do NOT paste full output into the report —
summarize counts and status only):

1. `bun run lint` — capture pass/fail and warning/error counts
2. `bun run build` — capture pass/fail (a build failure is an automatic Critical finding)
3. Use the Glob tool with `src/**/*.{ts,tsx}` and count results — total file count for scope

If the build fails, note the error but continue — the audit is still valuable.

## Phase 2: Domain Audits

Spawn **all 6 subagents in parallel** using the Agent tool (general-purpose type).
Each subagent receives identical instructions on methodology and output format, plus
its domain-specific rules and checklist.

### Shared instructions for every subagent

Include this in every subagent prompt:

> **Methodology:**
> 1. Read your assigned rule file(s) in full
> 2. Read `CLAUDE.md` for project-level rules
> 3. Use `Grep` to scan for anti-patterns across your target files first
> 4. Use `Read` only on files where Grep found hits or where you have specific concerns
> 5. For each finding, record the file path, line number, what's wrong, and a suggested fix
>
> **Output format — return exactly this structure:**
>
> ```
> ## [Domain Name] Audit
>
> ### Critical
> - **[file:line]**: [Issue] — [Suggested fix]
>
> ### Important
> - **[file:line]**: [Issue] — [Suggested fix]
>
> ### Minor
> - **[file:line]**: [Issue] — [Suggested fix]
>
> ### No Issues
> [If a severity has no findings, include the heading with "None"]
> ```
>
> **Rules:**
> - Be specific — always include file path and line number
> - No false positives — skip anything you're not confident about
> - No style nits that Biome already catches (formatting, import order)
> - High signal only — this is a quality audit, not a nitpick session

### Subagent 1: TypeScript Quality

**Rule files:** `.claude/rules/typescript.md`
**Target files:** `src/**/*.ts`, `src/**/*.tsx`
**Checklist:**
- No `any` types — use `unknown` with type guards
- `interface` preferred over `type` for object shapes
- No unsafe `as` type assertions that mask real type errors
- No orphaned type exports, no missing exports
- Proper generics (not overly complex, not missing where needed)
- No relative imports within `src/` — always use the `@/*` path alias

### Subagent 2: React Patterns

**Rule files:** `.claude/rules/react.md`
**Target files:** `src/components/**/*.tsx`, `src/app/**/*.tsx`
**Checklist:**
- No manual `useMemo`, `useCallback`, or `React.memo` (React Compiler handles this)
  - Exception: semantic guarantees (non-deterministic values, effect dependency control)
- `"use client"` only where genuinely needed (interactivity, hooks, browser APIs)
- Props: inline by default, named `interface Props` when readability demands it
- No stale closures or hook dependency issues
- No direct HTML elements when common components exist (`<Button>` not `<button>`, etc.)
- Correct use of Next.js App Router patterns (server components default, proper data fetching)

### Subagent 3: Database Layer

**Rule files:** `.claude/rules/database.md`
**Target files:** `src/actions/**/*.ts`, `src/lib/db/**/*.ts`
**Checklist:**
- ALL database operations live in `src/actions/` — none in pages or components
- Relational query API (`db.query.*`) preferred for reads; `db.select()` for aggregations
- No raw SQL strings
- PascalCase table references
- Multi-mutation actions wrapped in `db.transaction()`
- Proper error handling on DB operations
- No N+1 query patterns
- Write actions use `secureActionClient` with `metadata` and `inputSchema`
- Read functions use `checkAuth()` when authentication required

### Subagent 4: Forms & Validation

**Rule files:** `.claude/rules/forms.md`, `.claude/rules/coding-standards.md`
**Target files:** `src/lib/schemas/**/*.ts`, `src/lib/schemas/resolve.ts`, `src/components/**/*-form.tsx`, `src/components/**/*-dialog.tsx`, `src/actions/**/*.ts`
**Checklist:**
- `useHookFormAction` adapter — never separate `useForm` + `useAction` wiring
- `formResolver` from `@/lib/schemas/resolve` — not raw `zodResolver` (read `src/lib/schemas/resolve.ts` to understand the wrapper)
- Schema split: form schema (user input only) vs. action schema (extends with IDs/refinements)
- All schemas in `src/lib/schemas/`, not inline
- `.trim()` on every `z.string()` for user text (names, emails, descriptions, titles)
  - Exceptions: passwords, IDs, tokens
- Server errors handled via `form.setError("root", ...)` in `onError`
- Auth forms exempt from `useHookFormAction` (use standard `useForm`)
- `zod/v4` for all schemas except `src/lib/schemas/auth.ts` (which uses bare `zod`)

### Subagent 5: Design System & UI Copy

**Rule files:** `.claude/rules/design-system.md`, `.claude/rules/voice-and-tone.md`
**Target files:** `src/components/**/*.tsx`, `src/app/**/*.tsx`
**Checklist:**
- Semantic design tokens only — no raw Tailwind colors (`bg-blue-500`), use token classes
- No arbitrary color or font-size values (`bg-[#...]`, `text-[1.5rem]`) — use design tokens. Arbitrary layout values (`w-[...]`) are acceptable only when no Tailwind scale value fits.
- Typography tokens (`text-display`, `text-title`, `text-heading`, `text-body`, etc.)
- Spacing tokens (`gap-section`, `gap-group`, `gap-block`, `gap-element`, `px-page`, `py-page`)
- `text-foreground` / `text-muted-foreground` for text colors
- Icon-only buttons have `tooltip` prop
- `Button` uses `leftSection`/`rightSection` for icons
- Imports from `@/components/common/`, not directly from third-party packages
- No exclamation marks, emoji, or em dashes in user-facing UI copy
- Active voice, second person in UI text
- Consistent domain terminology ("candidate" not "actor/performer/talent", "production team" not "organizer")
- `cursor-pointer` on custom interactive elements

### Subagent 6: Architecture & Security

**Rule files:** `docs/ARCHITECTURE.md` (read only the Known Issues section and data-flow overview), `docs/DECISIONS.md`
**Target files:** all `src/` files
**Checklist:**
- Auth checks on all protected routes/actions (`checkAuth()` or `secureActionClient`)
- No direct DB queries in pages or components
- XSS vectors: `dangerouslySetInnerHTML`, unescaped user input
- Injection risks: string concatenation in queries or URLs
- No exposed secrets in code
- `dayjs` via `@/lib/dayjs` wrapper — no native `Date` or direct `dayjs` import
- `@/*` path alias used consistently
- No ESLint/Prettier artifacts (project uses Biome)
- Cross-reference Known Issues from `docs/ARCHITECTURE.md#known-issues` — are they still open or fixed?
- File naming: components PascalCase, utilities camelCase, routes lowercase
- No barrel files (except `src/lib/schemas/index.ts`)

## Phase 3: Synthesis

After all 6 subagents return, merge their reports:

1. **Deduplicate** — same file flagged by multiple domains? Consolidate under the most relevant domain
2. **Detect patterns** — same anti-pattern appearing 5+ times? Call it out as a systemic issue
3. **Escalate** — a Minor issue repeated 10+ times becomes Important
4. **Cross-reference** — do any findings contradict each other? Resolve by reading the relevant rule

## Phase 4: Librarian Update

Spawn the **librarian agent** in Update Mode:

> Sync all documentation in `docs/` with the current codebase state. Follow your
> Update Mode instructions. After syncing, report what you changed and any gaps
> you found.

## Phase 5: Final Report

Present this report to the user:

```
# Codebase Audit Report

**Scope:** [N] files audited across 6 domains
**Lint:** [pass/fail — N warnings, N errors]
**Build:** [pass/fail]

## Executive Summary
[2-3 sentences: overall health, most significant findings, biggest wins]

## Critical
[Must fix — bugs, security issues, data integrity risks]

- **[file:line]**: [Issue]
  - **Domain:** [which subagent]
  - **Impact:** [why it matters]
  - **Fix:** [concrete suggestion]

## Important
[Should fix — convention violations, maintainability, repeated patterns]

- **[file:line]**: [Issue]
  - **Domain:** [which subagent]
  - **Impact:** [why it matters]
  - **Fix:** [concrete suggestion]

## Minor
[Nice to fix — small improvements]

- **[file:line]**: [Issue] — [Fix]

## Systemic Patterns
[Anti-patterns that appeared across multiple files]

| Pattern | Occurrences | Severity | Example File |
|---------|-------------|----------|--------------|

## Known Issues Update
[Cross-reference with docs/ARCHITECTURE.md Known Issues]

| Issue | Status | Notes |
|-------|--------|-------|

## Documentation Sync
[What the librarian updated, and any gaps remaining]

## Health Scores

| Domain | Grade | Summary |
|--------|-------|---------|
| TypeScript Quality | [A-F] | |
| React Patterns | [A-F] | |
| Database Layer | [A-F] | |
| Forms & Validation | [A-F] | |
| Design System & UI | [A-F] | |
| Architecture & Security | [A-F] | |
```

## Rules

- **Never modify source files** — this is a read-only audit. Only the librarian modifies docs.
- **Parallel execution** — Phase 2 subagents MUST run in parallel (single message, 6 Agent tool calls).
- **Context discipline** — do not read source files in the main context. That's what subagents are for.
- **Actionable findings only** — every finding must have a file, line, and suggested fix.
