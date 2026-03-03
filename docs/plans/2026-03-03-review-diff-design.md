# Review Diff Command

A user-invocable command that reviews all uncommitted changes against project conventions.

## Trigger

- Claude Code: `/review-diff`
- Codex CLI: `$review-diff`

## Scope

Reviews `git diff HEAD` (staged + unstaged changes). If the diff is empty, reports "nothing to review" and stops.

## File layout

```
.claude/skills/review-diff/SKILL.md   # Claude Code
.agents/skills/review-diff/SKILL.md   # Codex (identical copy)
```

## Behavior

1. Gather context -- read project instructions and `docs/CONVENTIONS.md`
2. Run `git diff HEAD` to get the diff
3. Read each changed file in full (not just diff hunks)
4. Trace imports/exports of changed code to find consumers
5. Review against 7 dimensions: convention compliance, architecture alignment, bugs/edge cases, upstream/downstream effects, code organization, maintainability, security
6. Output structured report with Critical / Important / Minor sections

## Output format

Structured markdown report with file:line references, impact descriptions, and suggested fixes. Sections always present even if empty.

## Tool-specific notes

- Claude Code: `context: fork`, `model: sonnet` -- runs as isolated subagent
- Codex: self-contained skill, no special agent configuration needed
