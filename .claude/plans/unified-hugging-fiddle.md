# Plan: Configure GitHub Copilot to Mirror Claude Code Setup

## Context

Castparty has a mature Claude Code configuration (CLAUDE.md, 8 rule files, 2 custom agents, skills, hooks). The goal is to create a parallel GitHub Copilot configuration so the AI assistant in VS Code follows the same conventions, design system, and product thinking rules.

**Key insight:** Copilot natively reads `CLAUDE.md` (via `chat.useClaudeMdFile` setting). The Copilot config should *complement* CLAUDE.md, not duplicate it. Path-scoped rules must be duplicated since Copilot can't load `.claude/rules/` files — but the top-level instructions file stays thin.

## What Can't Be Replicated

| Claude Code Feature | Status |
|---|---|
| Plugin system (beads, feature-dev, superpowers, etc.) | No Copilot equivalent — skip |
| Skill forking (isolated subagent context) | No equivalent — prompts provide guidance but not isolation |
| Hooks (auto-format on write) | Already handled by VS Code `formatOnSave` — no gap |
| Hooks (delete old plan files) | Low value — skip |
| Session memory (MEMORY.md) | No general equivalent — skip |
| Beads issue tracking | CLI tool, not AI config — skip |

## Files to Create

```
.github/
├── copilot-instructions.md                    # Repo-wide instructions (thin — refs CLAUDE.md)
├── instructions/
│   ├── typescript.instructions.md             # applyTo: **/*.ts,**/*.tsx
│   ├── react.instructions.md                  # applyTo: **/*.tsx
│   ├── database.instructions.md               # applyTo: src/actions/**,src/lib/db/**
│   ├── design-system.instructions.md          # applyTo: **/*.tsx,**/*.scss
│   └── voice-and-tone.instructions.md         # applyTo: src/app/**/*.tsx,src/components/**/*.tsx
├── agents/
│   ├── code-reviewer.agent.md                 # Read-only review agent
│   └── docs-librarian.agent.md                # Documentation query/update agent
└── prompts/
    ├── review-changes.prompt.md               # "Review my changes"
    ├── update-docs.prompt.md                  # "Update docs after this feature"
    └── lookup-docs.prompt.md                  # "Look up library API"
```

Plus: add Copilot keys to `.vscode/settings.json`.

## Implementation Steps

### Step 1: Create `.github/copilot-instructions.md`

Thin top-level file that:
- Points to CLAUDE.md as the source of truth
- Restates the non-negotiable operational rules (never commit, never run app, push back, Bun, Biome)
- Summarizes the ATS-to-casting domain mapping
- Lists the docs/ inventory with "read when" guidance
- ~120 lines max

### Step 2: Create path-scoped instruction files

Five `.github/instructions/*.instructions.md` files, each with `applyTo` frontmatter. Content mirrors the corresponding `.claude/rules/` files, reformatted with Copilot's YAML frontmatter:

| File | Source | `applyTo` |
|---|---|---|
| `typescript.instructions.md` | `.claude/rules/typescript.md` + coding-standards.md | `**/*.ts,**/*.tsx` |
| `react.instructions.md` | `.claude/rules/react-conventions.md` + coding-standards.md | `**/*.tsx` |
| `database.instructions.md` | `.claude/rules/database.md` + coding-standards.md | `src/actions/**,src/lib/db/**` |
| `design-system.instructions.md` | `.claude/rules/design-system.md` | `**/*.tsx,**/*.scss` |
| `voice-and-tone.instructions.md` | `.claude/rules/voice-and-tone.md` | `src/app/**/*.tsx,src/components/**/*.tsx` |

### Step 3: Create custom agents

Two `.github/agents/*.agent.md` files:

**code-reviewer.agent.md** — Read-only review agent. Preserves the 7-dimension review framework and Critical/Important/Minor output format from the Claude version. Uses `read` + `search` tools only (no edit).

**docs-librarian.agent.md** — Documentation specialist with query and update modes. Uses `read` + `search` + `create_file` + `replace_in_file` tools.

### Step 4: Create prompt files

Three `.github/prompts/*.prompt.md` files as reusable slash commands:

- `/review-changes` — invokes the code-reviewer agent with user-specified files
- `/update-docs` — invokes the librarian agent after a feature change
- `/lookup-docs` — guides version-accurate library doc lookup (references bundled docs in `.claude/skills/dev-docs/references/`)

### Step 5: Update `.vscode/settings.json`

Add three Copilot-specific keys to the existing file:

```json
"github.copilot.chat.codeGeneration.instructions": [
  { "file": "CLAUDE.md" },
  { "file": ".github/copilot-instructions.md" }
],
"github.copilot.chat.reviewSelection.instructions": [
  { "file": ".github/copilot-instructions.md" }
],
"github.copilot.chat.commitMessageGeneration.instructions": [
  { "text": "Imperative mood, under 72 chars. Prefix with feature area (e.g., 'productions:', 'auth:'). No emoji." }
]
```

This explicitly tells Copilot to load both instruction files for code generation.

### Step 6: Enable CLAUDE.md reading in VS Code

Add to `.vscode/settings.json`:

```json
"chat.useClaudeMdFile": true
```

This ensures Copilot's agent mode reads the existing CLAUDE.md.

## Maintenance Strategy

When updating a `.claude/rules/*.md` file, update the corresponding `.github/instructions/*.instructions.md` in the same commit. The content is nearly identical — only the frontmatter format differs (`paths:` vs `applyTo:`).

Rules that live in CLAUDE.md only (not duplicated): product context, commands, beads workflow, plugin routing, docs system pointers.

## Verification

After creating all files:
1. Open VS Code with Copilot active
2. Open a `.tsx` file and ask Copilot Chat a question — verify it references project conventions
3. Switch to Agent mode and ask it to create a component — verify it uses common components, design tokens, server component by default
4. Try `/review-changes` and `/update-docs` prompts — verify they invoke the correct agents
5. Check that `formatOnSave` still works (Biome, not Prettier)

## Critical Files

- `/Users/andrew/Documents/Work/projects/castparty/CLAUDE.md` — source of truth, referenced by copilot-instructions.md
- `/Users/andrew/Documents/Work/projects/castparty/.claude/rules/*.md` — source content for path-scoped instructions
- `/Users/andrew/Documents/Work/projects/castparty/.claude/agents/code-reviewer.md` — reference for Copilot code-reviewer agent
- `/Users/andrew/Documents/Work/projects/castparty/.claude/agents/librarian.md` — reference for Copilot librarian agent
- `/Users/andrew/Documents/Work/projects/castparty/.vscode/settings.json` — existing file to extend with Copilot keys
- `/Users/andrew/Documents/Work/projects/castparty/docs/CONVENTIONS.md` — token tables needed in design-system instructions

## Agents Used During Implementation

- **Parallel write agents** (×2-3): Create the instruction files, agent definitions, and prompt files concurrently since they're independent
- **Code-quality reviewer**: After all files are created, review for consistency across the Claude and Copilot configs
