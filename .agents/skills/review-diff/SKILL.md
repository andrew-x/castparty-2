---
name: review-diff
description: >
  Review all uncommitted changes (git diff HEAD) for bugs, convention violations,
  security issues, edge cases, and downstream breakage. Produces a structured report
  with severity levels and actionable suggestions. Invoke with $review-diff after
  making changes, before committing.
---

# Diff Review

You review uncommitted code changes and produce a structured report. You do NOT fix
anything -- your output is a report the caller acts on.

## Step 1: Gather Context

Load the project's rules and conventions before reviewing any code:

1. Read `AGENTS.md` (or `CLAUDE.md` if present) for project-level rules
2. Read `docs/CONVENTIONS.md` -- always
3. Read `docs/ARCHITECTURE.md` if changes touch structure, routes, or component patterns
4. Read `docs/DECISIONS.md` if changes touch areas with prior ADRs

## Step 2: Get the Diff

Run `git diff HEAD` to see all uncommitted changes (staged + unstaged).

If the diff is empty, report:

```
## Review Report

No uncommitted changes found. Nothing to review.
```

Then stop.

## Step 3: Read Changed Files in Full

For every file in the diff, read the **entire file** -- not just the diff hunks. You
need surrounding context to evaluate whether changes are correct, consistent, and safe.

List all changed files from the diff output and read each one.

## Step 4: Trace Dependencies

For each changed file:

1. If any **exports** were modified (renamed, retyped, removed), search the codebase
   for all consumers of those exports.
2. If any **imports** were changed, verify the source still provides what's expected.
3. Check for side effects in untouched files -- renamed exports, changed types, modified
   shared utilities.

## Step 5: Review

Evaluate every change against these dimensions:

### Convention Compliance
- Naming (files, components, variables, types) per project conventions
- File structure and co-location patterns
- Import patterns (path aliases, ordering)
- Design token usage (no raw Tailwind values when semantic tokens exist)
- Common component usage (no raw HTML elements when a component exists)

### Architecture Alignment
- Server vs client components used correctly (App Router defaults to server)
- Data flow patterns match documented architecture
- Backend logic in `src/actions/`, not in pages or components
- Tech stack decisions respected (Bun, Biome, Tailwind v4, React 19)

### Bugs & Edge Cases
- Null/undefined handling, especially data from external sources
- Race conditions in async code
- Missing error boundaries around fallible UI
- Off-by-one errors in loops and slicing
- Unhandled promise rejections
- Incorrect TypeScript types that hide runtime errors
- Missing `.trim()` on user text input schemas

### Upstream/Downstream Effects
- Does this change break callers? Check all consumers of modified exports.
- Are shared utilities still correct for ALL consumers?
- Did type changes propagate correctly through the dependency chain?
- Are there implicit contracts (naming conventions, file-based routing) that broke?

### Code Organization
- Separation of concerns -- no God components or kitchen-sink utilities
- Appropriate abstractions (not premature)
- Related code co-located

### Maintainability & Readability
- Clear naming that reveals intent
- Reasonable function length
- No clever tricks that require comments to explain
- Self-documenting code preferred over comment-heavy code

### Security
- XSS vectors -- dangerouslySetInnerHTML, unescaped user input in templates
- Injection risks -- string concatenation in queries, shell commands, URLs
- Exposed secrets -- API keys, tokens, credentials in code or config
- Auth issues, broken access control, SSRF

## Output Format

Structure your report exactly like this:

```
## Review Report

### Summary
[1-2 sentences: what was changed and overall assessment]

### Critical
[Bugs, security issues, broken functionality -- must fix]

- **[file_path:line_number]**: [What's wrong]
  - **Why it matters:** [Impact]
  - **Suggested fix:** [Concrete suggestion]

### Important
[Convention violations, maintainability concerns, missing edge cases -- should fix]

- **[file_path:line_number]**: [What's wrong]
  - **Why it matters:** [Impact]
  - **Suggested fix:** [Concrete suggestion]

### Minor
[Style nits, clarity suggestions -- nice to fix]

- **[file_path:line_number]**: [What's wrong]
  - **Suggested fix:** [Concrete suggestion]

### No Issues Found
[If a severity level has no findings, include it with "None" -- don't omit the section]
```

## Rules

- **Be specific** -- always include file path and line number. Vague findings are useless.
- **No false positives** -- if you're not confident, don't report it. Noisy reviews get ignored.
- **No style wars** -- don't flag things that are valid per the project's conventions.
- **Severity matters** -- a missing aria-label is Minor. A SQL injection is Critical.
- **Praise what's good** -- if you see something well-done, mention it in the Summary.
