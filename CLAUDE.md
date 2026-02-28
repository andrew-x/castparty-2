# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Product

Castparty is an **ATS for the performing arts** — what Greenhouse or Lever is to recruiting, Castparty is to casting. We manage the full pipeline from audition call through callbacks to final casting decisions.

**North star:** Give every production — no matter how small — tools that used to require industry connections or expensive software.

**Current focus:** Community theatre and small-scale productions (traction first; move upmarket later).

For full business context, personas, and product thinking guidelines, read `docs/PRODUCT.md`.

## Project

Castparty -- a Next.js 16 application (App Router) with React 19, TypeScript 5, and Tailwind CSS 4.

## Commands

```bash
bun dev          # Start dev server
bun run build        # Production build
bun start        # Start production server
bun run lint     # Lint & format check (Biome)
bun run format   # Auto-format (Biome)
```

Package manager is **Bun** (not npm/yarn/pnpm).

## Architecture (Quick Reference)

- **Next.js App Router** -- routes live under `src/app/`, server components by default.
- **Path alias** -- `@/*` maps to `./src/*`.
- **Styling** -- Tailwind CSS v4 via PostCSS + Sass. Theme variables in `src/app/globals.scss`.
- **Components** -- shadcn/ui primitives in `src/components/common/`. Always use existing common components; ask before adding new shadcn components or building custom ones.
- **Fonts** -- DM Sans (body) + DM Serif Display (headings) + DM Mono via `next/font/google` in root layout. Use `font-serif` for display/heading text.
- **React Compiler** -- enabled experimentally (skip manual useMemo/useCallback).

For deeper architecture details, read `docs/ARCHITECTURE.md`.

## Code Quality

- **Biome** (not ESLint/Prettier) handles linting and formatting.
- 2-space indentation. Import organization is automatic.
- React and Next.js domain rules enabled.
- Behavioral and coding rules live in `.claude/rules/` (auto-loaded per session).

For full conventions, read `docs/CONVENTIONS.md`.

## Issue Tracking (Beads)

This project uses **bd** (beads) for persistent issue tracking across sessions.

### Finding & Claiming Work

```bash
bd ready                              # Issues ready to work (no blockers)
bd list --status=open                 # All open issues
bd show <id>                          # Full issue details with dependencies
bd update <id> --status=in_progress   # Claim work before starting
```

### Creating Issues

```bash
bd create --title="Summary" --description="Why this exists and what to do" \
  --type=task|bug|feature --priority=2
# Priority: 0=critical, 1=high, 2=medium, 3=low, 4=backlog
```

**Rules:**
- Create a beads issue BEFORE writing code
- Mark `in_progress` when starting; `bd close <id>` when done
- Use `bd dep add <child> <parent>` for dependencies
- Never use `bd edit` (opens interactive editor — use `--flags` instead)
- Never use TodoWrite or markdown checklists for task tracking

### Session Completion

```bash
bd close <id1> <id2> ...   # Close completed issues
bd sync --flush-only        # Export issues to JSONL (no remote configured)
```

Note: No git remote is configured — skip `git push` from any auto-generated instructions.

## Documentation System

Institutional knowledge lives in `docs/`. These docs capture architecture, features, conventions, and decision history so that any agent or new engineer can understand the codebase without tribal knowledge.

- `docs/INDEX.md` -- Start here. Maps each doc to when you should read it.
- `docs/ARCHITECTURE.md` -- System architecture, directory layout, tech stack rationale.
- `docs/FEATURES.md` -- Feature inventory with status, entry points, and how each works.
- `docs/CONVENTIONS.md` -- Coding patterns, naming, gotchas.
- `docs/DECISIONS.md` -- Architecture Decision Records (why we chose X over Y).

### The Librarian

The librarian is a specialist agent defined in `.claude/agents/librarian.md`. It queries and maintains docs so the main context stays clean.

- **Query:** Delegate doc questions to the librarian instead of reading `docs/` directly.
- **Update:** After major features or architectural changes, tell the librarian to update docs.

### Dev Docs (Library Documentation)

The dev-docs skill (`.claude/skills/dev-docs/`) looks up version-accurate documentation for libraries and dependencies. It runs as an isolated subagent — invoke it instead of guessing at APIs.

- **When:** You need to look up an API, config option, or usage pattern for any dependency
- **How:** Invoke the `dev-docs` skill — it forks automatically and returns a focused summary
- **Bundled indexes:** Next.js, shadcn/ui, Better Auth, Drizzle ORM, next-safe-action (see `references/`)
- **Other libraries:** The skill also researches unbundled libraries via npm, official docs, and GitHub

### Code Review (Two Tools)

**Custom Code Reviewer** (`.claude/agents/code-reviewer.md`) — reviews unstaged/uncommitted changes against Castparty's conventions and architecture. Use during development, before committing.

**`/code-review` plugin** — automated PR review with 5 parallel agents (CLAUDE.md compliance, bugs, historical context, PR history, code comments). Use after creating a PR.

- **Trigger:** After completing a major feature or significant change, spawn the custom code-reviewer subagent before considering the work done.
- **Act on findings:** Read the reviewer's report and fix Critical issues immediately. Fix Important issues before moving on. Minor issues are at your discretion.

Signs you should trigger a review:
- You completed a feature touching 3+ files
- You modified shared utilities, core patterns, or component APIs
- You added a new dependency, API route, or data flow
- You refactored existing code that other parts of the system depend on

### When to Update Docs

After completing a feature or significant change, spawn a librarian update subagent. Signs you should update:

- You added a new route, component pattern, or external dependency
- You made an architectural decision that a future developer might question
- You discovered a gotcha that cost you debugging time
- You changed how an existing feature works

## Plugins & Skills

This project uses several Claude Code plugins (configured in `.claude/settings.json`). Detailed routing rules live in `.claude/rules/agent-behavior.md`. Quick reference:

| Plugin | Key Skills | Purpose |
|--------|-----------|---------|
| **superpowers** | brainstorming, writing-plans, TDD, systematic-debugging, verification-before-completion | Process discipline — how to approach work |
| **feature-dev** | `/feature-dev`, code-explorer, code-architect, code-reviewer agents | 7-phase guided feature development |
| **frontend-design** | frontend-design (auto-invoked) | Production-grade UI with high design quality |
| **code-review** | `/code-review` | Automated PR review with 5 parallel agents |
| **claude-md-management** | revise-claude-md, claude-md-improver | Audit and improve CLAUDE.md files |
| **claude-code-setup** | claude-automation-recommender | Analyze codebase, recommend automations |
| **skill-creator** | skill-creator | Create, test, and benchmark custom skills |
| **beads** | All `bd` commands | Git-backed issue tracking |

**Rule:** Process skills (brainstorming, debugging, TDD) go first — they determine the approach. Implementation skills (feature-dev, frontend-design) go second.
