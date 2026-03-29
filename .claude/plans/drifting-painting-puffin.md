# Plan: Per-Feature Docs + Librarian Restructure

## Context

`docs/FEATURES.md` is a 1,209-line monolithic file with 50 inventory rows and 24 detailed subsections. As the feature set grows, this doesn't scale — finding, reading, and updating a single feature requires scanning a huge file. We're splitting it into one file per feature domain in `docs/features/`, with each doc detailed enough to recreate that feature from scratch. The librarian agent gets updated to maintain this new structure.

Additionally, the `/audit` command is for periodic drift-catching (not post-plan verification — that's `/review-diff`). We'll update `agent-behavior.md` to clarify this.

## Feature Files (17 files in `docs/features/`)

| File | Covers | Source |
|------|--------|--------|
| `auth.md` | Login, signup, password reset, email verification | Auth Flow subsection |
| `onboarding.md` | Multi-step post-auth setup | Onboarding subsection |
| `organizations.md` | Org CRUD, members, invitations, switcher, profiles | **New from source** — 17 actions, 12 components |
| `productions.md` | Production CRUD, create wizard, settings, role management | Create Production subsection + roles from source |
| `pipeline.md` | Configurable casting pipeline stages | Pipeline Stages subsection |
| `submissions.md` | Public submission flow, file uploads, location fields, R2, resume | 5 subsections merged (Public Submission, R2, Resume, Location, useCityOptions) |
| `kanban.md` | Role kanban, drag-drop, bulk actions, comparison, search, stage browse | Role Submissions Kanban subsection |
| `custom-fields.md` | Submission + feedback form builders, field types | Custom Form Fields subsection |
| `feedback.md` | Stage-anchored ratings, notes, custom field answers | Feedback Panel subsection |
| `comments.md` | Freetext notes on submissions | Comments subsection |
| `candidates.md` | Cross-production candidate list + detail view | **New from source** — 4 actions, 6 components |
| `reject-reasons.md` | Configurable rejection labels + reject flow | Reject Reasons subsection |
| `email.md` | Templates, storage, inbound email, emulator | 4 subsections merged |
| `submission-editing.md` | Edit contact, links, headshots, resume | Submission Editing subsection |
| `design-system.md` | Tokens, typography, spacing, common components | Design System + AutocompleteInput subsections |
| `app-shell.md` | Top nav, layout guards, routing, error pages, landing | App Shell + Error + Landing subsections |
| `admin.md` | Admin panel, dev tools (email simulator, user mgmt) | **New from source** — 7 actions, 10 components |

## Feature Doc Template

Every file follows this structure (richer than current — enables app recreation):

```markdown
# [Feature Name]

> **Last verified:** YYYY-MM-DD

## Overview
What it does, why it exists, who it serves (casting director, candidate, or both).

## Routes
| Path | Component | Auth | Description |

## Data Model
Tables involved, key columns, relationships. Reference schema.ts.

## Key Files
| File | Purpose |

## How It Works
Step-by-step data flow from user action → component → server action → database → response.
Include component tree, state transitions, ASCII flow diagrams where useful.

## Business Logic
Validation rules, edge cases, authorization checks, constraints.

## UI States
Loading, empty, error, success — how each is handled.

## Integration Points
Cross-references to related features using relative links: `[Feature Name](./feature-file.md)`.

## Architecture Decisions
Why built this way. Link to ADRs in DECISIONS.md if applicable.
```

## Implementation

### Step 1: Update librarian agent (`.claude/agents/librarian.md`)

Replace the simple 4-section template with the full 9-section template above. Key changes:
- Reference `docs/features/` directory instead of `docs/FEATURES.md`
- Add rule: "One file per feature domain in `docs/features/`. Create new files for new features; update existing files when extending a feature."
- Add rule: "Also add/update the row in `docs/features/README.md` when creating or renaming a feature file."
- Add rule: "Cross-reference related features with relative links: `[Feature Name](./feature-file.md)`"
- Update the 500-line-per-doc quality rule (still applies per feature file)
- Keep Query and Update modes, but Update Mode scans `docs/features/*.md` instead of one file

### Step 2: Create `docs/features/README.md`

Feature index file — replaces the inventory table from the top of FEATURES.md. Contains:
- The full inventory table (all ~50 rows) with a "Doc" column linking to each feature file
- Brief guide on how to add new feature docs

### Step 3: Write feature docs (6 parallel subagent batches)

Each subagent reads the relevant FEATURES.md subsection(s) + actual source code, then writes a detailed doc using the template. Subagents are instructed to verify all file paths, routes, and data model references against the codebase — not just copy existing content.

| Batch | Files | Notes |
|-------|-------|-------|
| A | `auth.md`, `onboarding.md`, `app-shell.md` | Lift + enrich from existing subsections |
| B | `productions.md`, `pipeline.md`, `reject-reasons.md` | Productions merges Create Production + roles from source |
| C | `submissions.md`, `custom-fields.md` | Submissions merges 5 subsections; largest composite |
| D | `kanban.md`, `feedback.md`, `comments.md` | Kanban needs route verification |
| E | `email.md`, `submission-editing.md`, `design-system.md` | Email merges 4 subsections |
| F | `organizations.md`, `candidates.md`, `admin.md` | **New from source** — no existing subsections, heaviest batch |

### Step 4: Update cross-references

- **`docs/INDEX.md`** — Replace `FEATURES.md` row with `features/` directory entry. Update the status line.
- **`docs/ARCHITECTURE.md`** — Check for FEATURES.md references and update to per-feature links.
- **`docs/DECISIONS.md`** — Same check.
- **`.claude/rules/agent-behavior.md` line 42** — Clarify `/audit` is periodic, not post-implementation:
  ```
  # Current:
  **Post-implementation:** requesting-code-review, finishing-a-development-branch, `/audit` (full-codebase quality check + librarian doc sync)

  # New:
  **Post-implementation:** requesting-code-review, finishing-a-development-branch

  **Periodic maintenance:** `/audit` (manual codebase quality check + librarian doc sync — run periodically to catch drift, not after every task)
  ```

### Step 5: Delete `docs/FEATURES.md`

Remove after all content is migrated and cross-references updated.

### Step 6: Update `/audit` command (`.claude/commands/audit.md`)

Phase 4 (Librarian Update) prompt already says "Sync all documentation in `docs/`" which will work with the new structure. No changes needed to the audit command itself — the librarian's updated instructions handle the rest.

## Files Modified

| File | Action |
|------|--------|
| `.claude/agents/librarian.md` | Edit — new template, per-feature structure |
| `docs/features/README.md` | Create — feature inventory index |
| `docs/features/*.md` (17 files) | Create — per-feature docs |
| `docs/INDEX.md` | Edit — point to features/ directory |
| `docs/FEATURES.md` | Delete — replaced by features/ |
| `.claude/rules/agent-behavior.md` | Edit — clarify /audit is periodic |
| `docs/ARCHITECTURE.md` | Edit if needed — fix FEATURES.md cross-refs |

## Verification

- All 17 feature files exist in `docs/features/` and follow the template
- `docs/features/README.md` inventory table links to every feature file
- `docs/INDEX.md` points to the new structure
- `docs/FEATURES.md` is deleted
- No remaining references to `FEATURES.md` in any doc or config file
- Librarian agent references the new per-feature structure
- `bun run build` passes (docs-only changes, no code impact)
