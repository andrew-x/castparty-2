# Copilot Instructions

> **Source of truth:** Read `CLAUDE.md` in the repo root for the full project guide.
> This file highlights the rules most relevant to Copilot's code-generation context.

## What Is Castparty?

Castparty is an **ATS (Applicant Tracking System) for the performing arts**. The ATS
analogy is the core framing:

| ATS Concept | Castparty Equivalent |
|---|---|
| Job posting | Production / Role |
| Candidate | Candidate (performer auditioning) |
| Application | Submission |
| Recruiter | Casting director / production team |
| Interview stages | Audition → Callback → Cast list |

**Current focus:** Community theatre — non-technical, budget-constrained, volunteer-run
productions. Solutions must work for a 15-person volunteer crew, not just Broadway.

## Non-Negotiable Rules

1. **Package manager is Bun** — never generate `npm`, `yarn`, or `pnpm` commands.
2. **Linter/formatter is Biome** — never reference ESLint or Prettier configs.
3. **Server components by default** — only add `"use client"` when the component
   genuinely needs browser APIs, event handlers, or React state.
4. **Always use common components** — import from `@/components/common/`, never use
   raw HTML elements (`<button>`, `<input>`, etc.) when a common component exists.
5. **Always use design tokens** — never use raw Tailwind color classes or arbitrary
   values. Use semantic tokens (`bg-primary`, `text-muted-foreground`, `gap-section`).
6. **Use dayjs for dates** — import from `@/lib/dayjs` (project wrapper with plugins),
   never from `"dayjs"` directly, never use native `Date`.
7. **Trim user text input** — all `z.string()` schemas for user text must chain
   `.trim()` before `.min()`, `.email()`, etc. Exception: passwords, IDs, tokens.
8. **No `any`** — use `unknown` and narrow with type guards.
9. **Interface over type** — use `interface` for object shapes; `type` only for unions,
   intersections, mapped types.
10. **No manual memoization** — React Compiler handles it. No `useMemo`, `useCallback`,
    or `React.memo`.

## Form Conventions

- **Use `useHookFormAction`** for action-connected forms — never wire `useForm` + `useAction` separately
- **Use `formResolver`** from `@/lib/schemas/resolve` — never raw `zodResolver`
- **Schema split:** form schema (user input only) in `src/lib/schemas/` + action schema (extends with IDs)
- **Loading:** `action.isPending`. **Server errors:** `form.setError("root", ...)`
- **Exception:** Auth forms using Better Auth use standard `useForm`

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4 (PostCSS + Sass)
- Drizzle ORM (PostgreSQL)
- Better Auth (authentication)
- next-safe-action (server action validation)
- shadcn/ui (component primitives in `src/components/common/`)
- Biome (lint + format, 2-space indent)
- Bun (package manager + runtime)

## Key Directories

| Path | Purpose |
|---|---|
| `src/app/` | Next.js App Router routes |
| `src/actions/` | Backend logic (reads + writes), organized by feature |
| `src/components/common/` | shadcn/ui primitives — always use these |
| `src/components/` | Feature-specific components |
| `src/lib/` | Shared utilities, DB config, auth |
| `src/styles/globals.scss` | Design tokens (CSS variables) |

## Documentation

Read these docs when working in their respective areas:

| Doc | Read when... |
|---|---|
| `docs/ARCHITECTURE.md` | Adding routes, changing data flow, or structural changes |
| `docs/CONVENTIONS.md` | Writing any code — naming, patterns, design tokens |
| `docs/features/README.md` | Modifying or adding features |
| `docs/DECISIONS.md` | Touching areas with prior architecture decisions |
| `docs/PRODUCT.md` | Making product/UX decisions, writing UI copy |

## Voice & Tone (UI Copy)

- Plain rehearsal-room language, no jargon
- No exclamation marks, no emoji, no em dashes in product UI
- "Production team" for organizer-side users, "candidate" for talent-side users
- Error messages: say what happened + what to do next
- Confirmations: brief ("Changes saved." not "Your changes have been successfully saved.")
