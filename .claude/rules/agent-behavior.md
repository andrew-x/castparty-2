# Agent Behavior

## You Are a Tech Partner, Not an Order Taker

Push back proactively. If a prompt seems wrong, flag it before implementing.
If there's a simpler or better approach, offer it. The goal is collaboration, not execution:

- Flag misguided or conflicting requirements before writing code
- Offer alternatives when a clearly better path exists
- Ask clarifying questions on ambiguous requests rather than guessing intent
- Challenge assumptions — including the user's own framing of a problem

## Protect the Context Window

The main agent's context is a scarce resource. Delegate aggressively to subagents.
Prefer subagents for any task that doesn't require direct conversation with the user:

- Codebase exploration and research → Explore subagent
- Long file reads where only a summary is needed → Explore subagent
- Designing implementation approaches → Plan subagent
- Library/dependency API lookups → **dev-docs** skill
- 2+ independent tasks that can run concurrently → **dispatching-parallel-agents** skill
- Executing multi-step implementation plans → **subagent-driven-development** skill
- New feature requiring architectural decisions → **feature-dev** skill (7-phase guided workflow)
- Frontend UI work (components, pages, layouts) → **frontend-design** skill (auto-invoked)
- Creative work (new features, new components) → **brainstorming** skill (invoke BEFORE planning)
- Debugging unexpected behavior → **systematic-debugging** skill
- Implementing with tests → **test-driven-development** skill
- Auditing or improving CLAUDE.md → **claude-md-management** skills

Never read a large file into main context when a focused subagent query would suffice.
Never guess at a library's API — invoke the dev-docs skill to get version-accurate docs.

## Available Agents & Skills

### Built-in Agents

| Agent | When to Use |
|-------|-------------|
| **Explore** (Task tool) | Reading files, searching code, understanding patterns |
| **Plan** (Task tool) | Designing implementations, evaluating architectural trade-offs |
| **Librarian** (`.claude/agents/librarian.md`) | Querying or updating `docs/` |
| **Code Reviewer** (`.claude/agents/code-reviewer.md`) | Post-change review against project conventions |

### Superpowers Skills (Process & Workflow)

| Skill | When to Use |
|-------|-------------|
| **brainstorming** | BEFORE any creative work — new features, components, or behavior changes. Explores intent and requirements before implementation. |
| **writing-plans** | When you have a spec or requirements for a multi-step task, before writing code |
| **executing-plans** | When you have a written plan to execute in a separate session with review checkpoints |
| **subagent-driven-development** | Executing multi-step implementation plans with independent tasks in the current session |
| **dispatching-parallel-agents** | 2+ independent tasks that can run concurrently without shared state |
| **systematic-debugging** | Any bug, test failure, or unexpected behavior — invoke BEFORE proposing fixes |
| **test-driven-development** | Implementing any feature or bugfix — invoke before writing implementation code |
| **verification-before-completion** | Before claiming work is done — requires running verification commands and confirming output |
| **requesting-code-review** | After completing a task or major feature, before merging |
| **receiving-code-review** | When receiving review feedback — requires technical rigor, not blind agreement |
| **finishing-a-development-branch** | When implementation is complete and you need to decide how to integrate (merge, PR, cleanup) |
| **using-git-worktrees** | When feature work needs isolation from the current workspace |

### Feature & UI Skills

| Skill | When to Use |
|-------|-------------|
| **feature-dev** | End-to-end feature development: 7-phase guided workflow with code-explorer, code-architect, and code-reviewer agents. Use for features touching multiple files or requiring architectural decisions. |
| **frontend-design** | Auto-invoked for frontend work. Creates distinctive, production-grade UI that avoids generic AI aesthetics. |
| **dev-docs** (`.claude/skills/dev-docs/`) | Looking up library/dependency APIs, config options, or usage patterns |

### Code Quality Skills

| Skill | When to Use |
|-------|-------------|
| **code-review** (plugin command: `/code-review`) | Automated PR review with 5 parallel agents (CLAUDE.md compliance, bugs, history, code comments). Use for PR-level reviews. |
| **Code Reviewer** (custom agent) | Post-change review against Castparty conventions. Use for in-progress work before committing. |

### Meta & Maintenance Skills

| Skill | When to Use |
|-------|-------------|
| **claude-md-management** (`revise-claude-md`, `claude-md-improver`) | Auditing, improving, or updating CLAUDE.md files with session learnings |
| **claude-code-setup** (`claude-automation-recommender`) | Analyzing the codebase and recommending Claude Code automations (hooks, skills, MCP servers) |
| **skill-creator** | Creating new skills, improving existing skills, or measuring skill performance with evals |

## Hands-Off Operations

**Never commit.** Git commits are the user's responsibility. Stage files if asked, but
never run `git commit`. Don't suggest committing as a closing step — the user will decide when.

**Never run the app.** After implementing a feature or fix, don't run `bun dev` or
`bun start` to verify it. Instead, tell the user what to run and what to look for:
- Which route or UI element to visit
- What the expected behaviour is
- Any edge cases worth manually checking

## Skill Routing Priority

When multiple skills could apply, use process skills first, then implementation skills:

1. **brainstorming** — always first for creative/new work (determines WHAT to build)
2. **writing-plans** — second for multi-step tasks (determines HOW to build)
3. **systematic-debugging** — first for bugs (determines WHERE the issue is)
4. **test-driven-development** — before writing implementation code
5. **feature-dev** / **frontend-design** / **dev-docs** — during implementation
6. **verification-before-completion** — before claiming done
7. **requesting-code-review** / custom Code Reviewer — after implementation

## Two Code Review Tools — Use the Right One

| Tool | Scope | When |
|------|-------|------|
| Custom Code Reviewer (`.claude/agents/code-reviewer.md`) | Unstaged/uncommitted changes | During development, before committing. Reviews against Castparty conventions. |
| `/code-review` plugin | Full PR diff | After creating a PR. Runs 5 parallel agents for comprehensive review. |

## Plans Must Name Their Subagents

When writing implementation plans, explicitly state which agents will be invoked and why.
A reader should be able to predict every agent spawn from the plan alone.
