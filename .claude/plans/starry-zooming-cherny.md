# Claude Code Configuration Audit & Optimization

## Context

Castparty's Claude Code setup is already well above average — clear CLAUDE.md under 200 lines, modular rules, custom agents and skills, formatting hooks. But the auto-loaded instruction budget is heavier than it needs to be (809 lines worst-case), there are frontmatter inconsistencies that may break scoping, factual errors, and redundancy between files. This plan brings the config in line with current best practices from Anthropic's official docs and Boris Cherny's (head of Claude Code) recommendations.

**Sources consulted:**
- [Official Claude Code memory/rules docs](https://code.claude.com/docs/en/memory)
- [Official Claude Code settings docs](https://code.claude.com/docs/en/settings)
- [Official best practices](https://code.claude.com/docs/en/best-practices)
- GitHub issues on `paths:` vs `globs:` frontmatter (#13905, #17204, #16299)
- Boris Cherny workflow recommendations (via VentureBeat, X/Twitter)
- Community production configs (Trail of Bits, ChrisWiles showcase)

---

## Phase 1: Fix Bugs & Inconsistencies

### 1.1 Fix incorrect path in CLAUDE.md (line 35)
- **File:** `CLAUDE.md` line 35
- **Change:** `src/app/globals.scss` → `src/styles/globals.scss`

### 1.2 Standardize frontmatter to `paths:` (the documented key)
Two files use `globs:` which is NOT the documented frontmatter key. The official docs specify `paths:`. These files may not be scoping correctly.

- **`design-system.md`** — Change `globs:` → `paths:`
- **`voice-and-tone.md`** — Change `globs:` → `paths:`

### 1.3 Clean up settings.local.json
- Remove duplicate `Bash(ls:*)` and `Bash(cat:*)` entries

### 1.4 Add `$schema` to settings.json
Add `"$schema": "https://json.schemastore.org/claude-code-settings.json"` for editor autocomplete/validation.

---

## Phase 2: Reduce Always-Loaded Budget

Currently 4 rules files have no frontmatter and load unconditionally every session (354 lines) plus CLAUDE.md (116 lines) = **470 lines always loaded**.

### 2.1 Scope `forms.md` with `paths:` frontmatter
This 91-line file is only relevant when editing form components or schema files.

```yaml
---
paths:
  - "src/components/**/*-form.tsx"
  - "src/components/**/*-dialog.tsx"
  - "src/lib/schemas/**/*.ts"
  - "src/actions/**/*.ts"
---
```

**Saves:** ~91 lines from always-loaded baseline.

### 2.2 Remove redundant sections from `coding-standards.md`
Three sections repeat what CLAUDE.md already says in its Architecture section:
- "Server components first" (lines ~19-23) — duplicates CLAUDE.md lines 33, 39
- "Backend business logic lives in `src/actions/`" (lines ~25-52 with code example) — duplicates CLAUDE.md line 39
- "Always use common components" (lines ~54-78 with code example) — duplicates CLAUDE.md line 36

**Action:** Remove the prose restating the rule (CLAUDE.md is authoritative) but keep the code examples as a compact "Examples" section. This cuts ~30-40 lines.

### 2.3 Merge `react-compiler.md` and `react-conventions.md` into `react.md`
These are 40 and 31 lines respectively, both scoped to `*.tsx`, and `react-conventions.md` already cross-references `react-compiler.md`. Merge into a single `react.md`.

```yaml
---
paths:
  - "**/*.tsx"
---
```

**Saves:** Marginal line savings but reduces file count and eliminates cross-referencing overhead.

---

## Phase 3: Reduce Redundancy

### 3.1 Replace CLAUDE.md's "Plugins & Skills" section (lines 102-116)
This 15-line table duplicates the more detailed routing tables in `agent-behavior.md`. Since `agent-behavior.md` loads every session, the CLAUDE.md table is noise.

**Replace with:**
```markdown
## Plugins & Skills

8 plugins are configured in `.claude/settings.json`. Routing rules and skill inventory live in `.claude/rules/agent-behavior.md`.
```

### 3.2 Compress `agent-behavior.md` skill tables
Lines 34-84 contain 5 tables with 23 skill entries. Most plugins come with their own trigger descriptions. The agent needs routing priority and disambiguation rules, not a comprehensive catalog.

**Replace the 5 tables (~50 lines) with a compressed list (~12 lines):**

```markdown
## Available Skills

**Built-in agents:** Explore (codebase research), Plan (architecture), Librarian (docs/), Code Reviewer (pre-commit review)

**Process (invoke first):** brainstorming → writing-plans → systematic-debugging → TDD → verification-before-completion

**Implementation:** feature-dev (multi-file features), frontend-design (auto for UI), dev-docs (library APIs)

**Post-implementation:** requesting-code-review, finishing-a-development-branch

**Meta (enable on demand):** claude-md-management, claude-code-setup, skill-creator
```

**Saves:** ~38 lines from always-loaded.

### 3.3 Clarify review-diff skill vs code-reviewer agent
These serve different workflows but are currently ~85% identical in implementation, making it unclear why both exist.

- **`/review-diff` skill** — User-invoked quick second opinion on current changes
- **code-reviewer agent** — Agent-spawned comprehensive review after major features

**Action:**
- **Differentiate the skill:** Trim `review-diff` to be a lighter, faster review focused on bugs and obvious issues. Remove the heavy context-gathering steps (reading all rules, tracing all dependencies) that duplicate the agent's thoroughness. Target ~80 lines.
- **Keep the agent thorough:** The code-reviewer agent remains the comprehensive review that reads `.claude/rules/`, traces imports/exports, and produces the full severity-rated report.
- **Update `agent-behavior.md`** to clearly document when each is used:
  - `/review-diff` = "I want a quick sanity check on what I've changed"
  - code-reviewer agent = "Comprehensive review before considering a feature done"

---

## Phase 4: Plugin Pruning

### 4.1 Disable meta plugins
Three plugins are meta-tools used <5% of sessions. Each adds system prompt overhead every session.

**Disable in `settings.json`:**
- `claude-md-management` — only for auditing CLAUDE.md itself
- `claude-code-setup` — only for initial project setup
- `skill-creator` — only for building new skills

User can re-enable these on demand when needed.

---

## Phase 5: Safety & Quality Hooks

### 5.1 Add PreToolUse guard for sensitive files
Block writes to `.env` files and credentials without user confirmation:

```json
{
  "matcher": "Edit|Write",
  "hooks": [
    {
      "type": "command",
      "command": "FILE=$(cat | jq -r '.tool_input.file_path // empty') && case \"$FILE\" in */.env*|*/credentials*|*/.claude/settings.json) echo '{\"decision\": \"block\", \"reason\": \"Sensitive file — confirm with user before modifying.\"}'; exit 0;; esac"
    }
  ]
}
```

---

## Phase 6: Consider but NOT Recommended

| Idea | Why Skip It |
|------|-------------|
| **Add MCP servers** | No clear need — Drizzle handles DB, no external APIs need wrappers. Complexity without value. |
| **Move all rules to docs/** | Loses `paths:` frontmatter scoping. Current approach is better. |
| **Aggressively prune small rules** | typescript.md (20 lines) preventing `any` is cheap to load, expensive to lose. |
| **Split agent-behavior.md** | Guardrails ("never commit") must load every session. Skill routing benefits from one location. |
| **Use `@import` syntax** | Could reduce CLAUDE.md size but adds indirection. Current approach is clearer. |

---

## Projected Impact

| Metric | Before | After |
|--------|--------|-------|
| Always-loaded lines (CLAUDE.md + unscoped rules) | ~470 | ~280 |
| Frontend work (tsx files) | ~762 | ~560 |
| Worst case (full-stack) | ~809 | ~620 |
| Rule files | 10 | 8 |
| Enabled plugins | 8 | 5 |
| Factual errors | 1 | 0 |
| Frontmatter inconsistencies | 2 files using wrong key | 0 |
| Code review tools clearly differentiated | No | Yes |

---

## Verification

After implementing:
1. Run `/memory` in a new Claude Code session — verify the correct rules are loaded and path-scoped rules only appear when editing matching files
2. Open a `.tsx` file — verify `react.md`, `design-system.md`, `voice-and-tone.md` load
3. Open a `.ts` file in `src/actions/` — verify `database.md`, `typescript.md` load, and `forms.md` loads for schema files
4. Verify `forms.md` does NOT load when editing a non-form file
5. Run `bun run lint` — ensure no formatting regressions
6. Start a new session and check that disabled plugins are not in the system prompt

---

## Files to Modify

| File | Action |
|------|--------|
| `CLAUDE.md` | Fix path (line 35), replace Plugins section (lines 102-116) |
| `.claude/rules/design-system.md` | Change `globs:` → `paths:` in frontmatter |
| `.claude/rules/voice-and-tone.md` | Change `globs:` → `paths:` in frontmatter |
| `.claude/rules/forms.md` | Add `paths:` frontmatter |
| `.claude/rules/coding-standards.md` | Remove sections duplicating CLAUDE.md, keep code examples only |
| `.claude/rules/agent-behavior.md` | Compress skill tables, simplify code review section |
| `.claude/rules/react-compiler.md` | Merge into new `react.md` |
| `.claude/rules/react-conventions.md` | Merge into new `react.md`, delete original |
| `.claude/skills/review-diff/SKILL.md` | Trim to lighter/faster review (~80 lines), remove heavy context-gathering that duplicates agent |
| `.claude/settings.json` | Add `$schema`, disable 3 meta plugins, add PreToolUse safety hook |
| `.claude/settings.local.json` | Remove duplicate permissions |

---

## Phase 7: Codex CLI Alignment

### Context

Codex CLI (v0.114.0) is also configured for this project. It reads `AGENTS.md` as its sole instruction source (with `CLAUDE.md` as fallback, but since AGENTS.md exists, CLAUDE.md is not read). The `AGENTS.md` file is a monolithic 296-line file that must be self-contained since Codex has no rules/ directory equivalent.

**Current issues:**
- Wrong `globals.scss` path (line 45) — same bug we fixed in CLAUDE.md
- Content drift — AGENTS.md hasn't been synced after the Claude Code optimization
- Some sections are more verbose than needed (full code examples for rules that CLAUDE.md states concisely)
- Missing form conventions section (present in Claude Code rules but absent from AGENTS.md)

### 7.1 Sync AGENTS.md with optimized rules
Rewrite AGENTS.md to match our optimized Claude Code configuration:
- Fix the `globals.scss` path
- Add form conventions (was missing entirely)
- Remove Claude-specific content (agents, skills, plugins — Codex doesn't have these)
- Keep the monolithic format (Codex requires it)
- Ensure all coding standards, design system, voice/tone, and workflow rules match

### 7.2 Review config.toml
The project config looks solid. No changes needed to `.codex/config.toml`.

**Files to modify:**
| File | Action |
|------|--------|
| `AGENTS.md` | Rewrite to sync with optimized Claude Code rules |
