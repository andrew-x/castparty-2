# Sync AI Agent Configurations

## Context

Claude Code is the source of truth for project conventions and rules. Three other AI tools also have configuration: **Codex** (`AGENTS.md` + `.codex/`), **GitHub Copilot** (`.github/copilot-instructions.md` + `.github/instructions/` + `.github/agents/` + `.github/prompts/`), and **Cursor** (no config exists yet). An audit found two categories of drift:

1. **Stale `docs/FEATURES.md` reference** — `docs/FEATURES.md` was split into `docs/features/README.md` + per-feature docs, but the old path was never updated in 7 files (including CLAUDE.md itself).
2. **Missing conventions** — Some Claude rules are not reflected in the other tools' configs.
3. **Cursor has no configuration at all.**

## Files to Modify

### Fix stale `docs/FEATURES.md` → `docs/features/README.md`

All 7 files reference a path that no longer exists:

| File | Lines | Change |
|------|-------|--------|
| `CLAUDE.md` | 58 | `docs/FEATURES.md` → `docs/features/README.md` |
| `AGENTS.md` | 68, 72 | `docs/FEATURES.md` → `docs/features/README.md` |
| `.github/copilot-instructions.md` | 72 | `docs/FEATURES.md` → `docs/features/README.md` |
| `.github/agents/code-reviewer.agent.md` | 25 | `docs/FEATURES.md` → `docs/features/README.md` |
| `.github/agents/docs-librarian.agent.md` | 81 | `docs/FEATURES.md` → `docs/features/README.md` |
| `.github/prompts/update-docs.prompt.md` | 11 | `docs/FEATURES.md` → `docs/features/README.md` |
| `.codex/agents/code-reviewer.toml` | 13 | `docs/FEATURES.md` → `docs/features/README.md` |

### Sync missing conventions

#### AGENTS.md — add seed-data rule

AGENTS.md is otherwise comprehensive. The only missing Claude rule is **seed-data** (keep seed data generator in sync with schema changes). Add a brief section after the Database Conventions section.

#### .github/copilot-instructions.md — add form conventions

The file is intentionally concise but is missing form patterns that Copilot would generate incorrectly without guidance. Add a brief "Form Conventions" section covering:
- `useHookFormAction` (not separate `useForm` + `useAction`)
- `formResolver` from `@/lib/schemas/resolve` (not raw `zodResolver`)
- Schema split: form schema (user input) vs action schema (extends with IDs)
- Schemas live in `src/lib/schemas/`

#### .github/instructions/ — add forms.instructions.md

The 5 existing instruction files map to Claude rules, but `forms.md` has no equivalent. Create `forms.instructions.md` scoped to form/dialog/schema files, matching Claude's `.claude/rules/forms.md` content.

### Create Cursor configuration

Create `.cursorrules` at the repo root. This file should match the structure and content of `AGENTS.md` since both serve as comprehensive single-file references for agentic tools. Adapt Claude-specific references (`.claude/` paths) to be tool-agnostic.

## Implementation Plan

**Subagent strategy:** Use 2 parallel editing subagents to maximize throughput.

### Step 1: Fix stale references (main agent)

Simple find-and-replace across all 7 files. Replace `docs/FEATURES.md` with `docs/features/README.md`. Each edit is a single-line change.

### Step 2: Add missing conventions (2 parallel subagents)

**Subagent A** — Codex + Copilot sync:
1. Add seed-data section to `AGENTS.md` (after Database Conventions, before Form Conventions)
2. Add brief form conventions section to `.github/copilot-instructions.md` (after Non-Negotiable Rules)
3. Create `.github/instructions/forms.instructions.md` modeled on `.claude/rules/forms.md`

**Subagent B** — Create `.cursorrules`:
1. Use `AGENTS.md` as the template (it's the most complete non-Claude config)
2. Adapt references: remove Codex-specific mentions (`.codex/`, hooks, config.toml)
3. Add Cursor-appropriate framing (reference `CLAUDE.md` as source of truth)
4. Include the seed-data rule (so it's in sync from day one)
5. Include form conventions (same content as AGENTS.md)

### Step 3: Verify with linter

Run `bun run lint` to confirm no formatting issues were introduced.

## Verification

1. `grep -r "docs/FEATURES.md" .` should return zero results (only in `.claude/plans/` which are ephemeral)
2. Each tool's config references `docs/features/README.md` correctly
3. Seed-data rule appears in: AGENTS.md, .cursorrules
4. Form conventions appear in: AGENTS.md (already there), .github/copilot-instructions.md, .github/instructions/forms.instructions.md, .cursorrules
5. `bun run lint` passes
6. `.cursorrules` exists and covers all conventions from AGENTS.md
