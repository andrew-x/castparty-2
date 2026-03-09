# AGENTS.md

This file provides project context, architecture, and coding conventions for AI coding agents working in this repository.

## Product

Castparty is an **ATS for the performing arts** -- what Greenhouse or Lever is to recruiting, Castparty is to casting. We manage the full pipeline from audition call through callbacks to final casting decisions.

**North star:** Give every production -- no matter how small -- tools that used to require industry connections or expensive software.

**Current focus:** Community theatre and small-scale productions (traction first; move upmarket later).

For full business context, personas, and product thinking guidelines, read `docs/PRODUCT.md`.

### Business Value is Not Optional

Every feature, UI element, or API endpoint exists to serve a real user need. Before writing code, be able to answer:

1. **Who benefits?** Casting director, performer, or both?
2. **What problem does this solve?** Name the specific friction it removes.
3. **Does this fit our current stage?** We serve community theatre first -- solutions should work for a small volunteer-run production, not just a Broadway show.

If you can't answer these, flag it before implementing. If a requested feature seems misaligned with the target persona or overly complex for community theatre scale, say so and offer a simpler alternative.

## Project

Castparty -- a Next.js 16 application (App Router) with React 19, TypeScript 5, and Tailwind CSS 4.

### Commands

```bash
bun dev          # Start dev server
bun run build    # Production build
bun start        # Start production server
bun run lint     # Lint & format check (Biome)
bun run format   # Auto-format (Biome)
```

Package manager is **Bun** (not npm/yarn/pnpm).

## Architecture

- **Next.js App Router** -- routes live under `src/app/`, server components by default.
- **Path alias** -- `@/*` maps to `./src/*`.
- **Styling** -- Tailwind CSS v4 via PostCSS + Sass. Theme variables in `src/app/globals.scss`.
- **Components** -- shadcn/ui primitives in `src/components/common/`. Always use existing common components; ask before adding new shadcn components or building custom ones.
- **Fonts** -- DM Sans (body) + DM Serif Display (headings) + DM Mono via `next/font/google` in root layout. Use `font-serif` for display/heading text.
- **React Compiler** -- enabled experimentally (skip manual useMemo/useCallback).
- **Backend logic** -- lives in `src/actions/[feature]/`. Writes use `next-safe-action` (`secureActionClient`); reads are plain server functions. Server components first -- only `"use client"` when genuinely needed.

For deeper architecture details, read `docs/ARCHITECTURE.md`.

## Code Quality

- **Biome** (not ESLint/Prettier) handles linting and formatting. Run `bun run format` after making changes.
- 2-space indentation. Import organization is automatic.
- React and Next.js domain rules enabled.

For full conventions, read `docs/CONVENTIONS.md`.

## Documentation System

Institutional knowledge lives in `docs/`. Read these docs for context before making significant changes:

- `docs/INDEX.md` -- Start here. Maps each doc to when you should read it.
- `docs/ARCHITECTURE.md` -- System architecture, directory layout, tech stack rationale.
- `docs/FEATURES.md` -- Feature inventory with status, entry points, and how each works.
- `docs/CONVENTIONS.md` -- Coding patterns, naming, gotchas.
- `docs/DECISIONS.md` -- Architecture Decision Records (why we chose X over Y).

After completing a feature or significant change, update the relevant docs (especially `docs/FEATURES.md` and `docs/CONVENTIONS.md`).

## Coding Standards

### Developer Ergonomics First

Optimize for the developer reading the code. When brevity conflicts with clarity, choose clarity. Add comments only for non-obvious logic, workarounds, or intentional deviations from convention. Don't comment what the code clearly does -- comment *why* it does it.

### Server Components First

Default to server components and pages. Only add `"use client"` when a component genuinely needs browser APIs, event handlers, or React state. Pass server-fetched data down as props rather than fetching in client components.

### Backend Business Logic

All backend logic lives in `src/actions/[feature]/`. Organized by feature area.

**Writes (client-callable):** Use `next-safe-action` with `secureActionClient` (or `publicActionClient` for unauthenticated actions). Always provide `.metadata()` and `.inputSchema()`:

```ts
export const createProduction = secureActionClient
  .metadata({ action: "create-production" })
  .inputSchema(z.object({ name: z.string().trim().min(1) }))
  .action(async ({ parsedInput: { name }, ctx: { user } }) => {
    // ...
  })
```

**Reads (server-only):** Plain `async` functions with `checkAuth()` for auth. Called directly from server components.

```ts
export async function getProductions() {
  const user = await checkAuth()
  // query and return
}
```

### Always Use Common Components

All UI elements must use components from `src/components/common/`. Never use raw HTML elements (`<button>`, `<input>`, `<select>`, `<textarea>`, etc.) when a common component exists.

```tsx
// Correct
import { Button } from "@/components/common/button"
import { Input } from "@/components/common/input"

// Wrong -- raw HTML bypasses design system
<button className="rounded bg-primary px-4 py-2">Save</button>
```

If a common component doesn't support your use case, flag it rather than working around it.

### Trim Whitespace on Text Input

All `z.string()` schemas that accept user text input must include `.trim()` before validation:

```ts
name: z.string().trim().min(1, "Name is required.").max(100)
email: z.string().trim().email("Enter a valid email.")
```

**Exceptions:** Passwords, IDs/tokens, code fields where whitespace is significant.

### Use dayjs for All Date/Time Work

Never use native `Date` objects. Use `dayjs` imported from the project wrapper (which pre-loads plugins):

```ts
import day from "@/lib/dayjs";
const now = day();
const formatted = day(someDate).format("LL");
```

### TypeScript Conventions

- Prefer `interface` over `type` for object shapes, component props, API contracts
- Use `type` only for unions, intersections, mapped/conditional types
- No `any` -- use `unknown` and narrow with guards

### React Conventions

- Inline props by default; switch to `interface Props` when readability demands it
- The React Compiler handles memoization -- do NOT use `useMemo`, `useCallback`, or `React.memo` for performance. Exceptions: non-deterministic run-once-on-mount values, effect dependency control
- Prefer Tailwind utility classes for all styling. Reserve inline `style={}` only for runtime-computed values

### Database Conventions

- All DB operations live in `src/actions/` -- never query in page or component files
- Prefer the Drizzle relational query API (`db.query`) for reads:

```ts
const production = await db.query.Production.findFirst({
  where: (p) => eq(p.id, id),
  with: { roles: true },
})
```

- Fall back to `db.select()` for aggregations or complex joins
- No raw SQL. If a query can't be expressed in Drizzle, flag it
- PascalCase table references. Better Auth tables have PascalCase aliases

---

## Design System

### Always Use Design Tokens

All colors, text sizes, and spacing must come from tokens in `src/styles/globals.scss`. Never use raw Tailwind values or arbitrary values like `bg-[#abc123]`.

```tsx
// Correct
<div className="bg-brand text-foreground px-page gap-section" />

// Wrong
<div className="bg-[#6c47ff] text-stone-900 px-4 gap-8" />
```

If a design need can't be satisfied by an existing token, propose a new one rather than using a raw value.

### Text Colors

| Level | Class |
|-------|-------|
| Primary | `text-foreground` |
| Muted / secondary | `text-muted-foreground` |

Never use raw Tailwind color classes for text.

### Typography Scale

| Token | Class | Use |
|-------|-------|-----|
| Display | `text-display` | Hero headings |
| Title | `text-title` | Page/section titles |
| Heading | `text-heading` | Subsection headings |
| Body large | `text-body-lg` | Lead/intro text |
| Body | `text-body` | Body text |
| Label | `text-label` | UI labels, buttons |
| Caption | `text-caption` | Fine print, badges |

### Spacing Scale

| Token | Class examples | Use |
|-------|---------------|-----|
| Page | `px-page`, `py-page` | Page edge padding |
| Section | `gap-section` | Between major sections |
| Group | `gap-group` | Between related groups |
| Block | `gap-block` | Between block-level items |
| Element | `gap-element` | Between tightly coupled elements |

### Component Library: shadcn/ui

All UI primitives come from shadcn/ui, installed in `src/components/common/`.

1. **Use what exists first.** Check `src/components/common/` before building anything new.
2. **Need a new shadcn component?** Ask first: "We need `<ComponentName>` from shadcn. Should I add it?"
3. **Need something shadcn doesn't offer?** Ask before building: "shadcn doesn't have this. I'd build a custom one in `src/components/common/`. Should I proceed?"
4. Keep common components minimal -- no feature-specific logic. Generic primitives only.

### Interactive Elements

- Every clickable element must show `cursor: pointer` (enforced globally via CSS)
- Every icon-only button must have a tooltip via the `tooltip` prop on `Button`
- Use `leftSection` / `rightSection` props on `Button` for icons alongside labels

```tsx
<Button variant="ghost" size="icon" tooltip="Delete role">
  <TrashIcon />
</Button>
<Button leftSection={<PlusIcon />}>Add role</Button>
```

---

## Voice & Tone (UI Copy)

Castparty sounds like a competent friend who volunteers at your theatre. Friendly, direct, never condescending, never corporate.

**Rules:**
- Plain language over jargon. "Add a performer" not "Create a talent record."
- Short and direct. Button labels 1-3 words. Descriptions one sentence max.
- Active voice, second person. "You haven't added any performers yet."
- No exclamation marks, no emoji, no em dashes in the product UI.
- Don't anthropomorphize the product.

**Error messages:** Say what happened and what to do next.
> "We couldn't save your changes. Check your connection and try again."

**Confirmation messages:** Brief. "Changes saved." Not "Your changes have been successfully saved."

### Consistent Role Nouns

| Role | Term | Don't use |
|------|------|-----------|
| Organizer-side users | **production team** | admins, managers, organizers |
| Talent-side users | **candidate** | actor, auditionee, talent, performer |

Use theatre terminology correctly. "Callback" not "second audition." "Cast list" not "assignment roster."

---

## Workflow Rules

### You Are a Tech Partner, Not an Order Taker

Push back proactively. If a prompt seems wrong, flag it before implementing. If there's a simpler or better approach, offer it. Challenge assumptions, ask clarifying questions on ambiguous requests.

### Hands-Off Operations

**Never commit.** Git commits are the user's responsibility. Stage files if asked, but never run `git commit`.

**Never run the app.** After implementing a feature, tell the user what to run and what to look for:
- Which route or UI element to visit
- What the expected behavior is
- Any edge cases worth manually checking

### Code Review Triggers

After completing a feature touching 3+ files, modifying shared utilities, adding a dependency, or refactoring code others depend on, use the `/review` command to review your changes before considering the work done.

### Avoid Over-Engineering

- Don't add features, refactor code, or make improvements beyond what was asked
- Don't add error handling for scenarios that can't happen
- Don't create helpers or abstractions for one-time operations
- The right amount of complexity is the minimum needed for the current task
