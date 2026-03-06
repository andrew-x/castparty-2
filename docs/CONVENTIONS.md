# Conventions

## Core Principles

### Developer Ergonomics First

Optimize for the developer reading the code, not just the machine executing it.
Maintainable, readable, and easy-to-work-with code is the default goal.
When brevity conflicts with clarity, choose clarity.

### Self-Documenting Code

Let naming, structure, and types communicate intent. Add comments only for:

- **Non-obvious logic** — e.g., a workaround for a library or browser quirk
- **Non-conventional patterns** — intentional deviation from the norm (explain why)
- **Especially complex algorithms or state machines**

Don't comment what the code clearly does. Comment *why* it does it.

## File & Naming

| What | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `UserProfile.tsx` |
| Utility modules | camelCase | `formatDate.ts` |
| Route directories | lowercase | `src/app/dashboard/` |
| Style files | kebab-case or `globals.scss` | `globals.scss` |

No barrel files (`index.ts` re-exports). Import from the actual file.

## TypeScript

### Prefer `interface` over `type`

Use `interface` for object shapes, component props, and API contracts.
Use `type` only when `interface` cannot express it:
- Union types: `type Status = "active" | "inactive"`
- Intersection types built from non-object shapes
- Mapped types and conditional types

### No `any`

Use `unknown` when the type is genuinely unknown, then narrow with guards.
`any` disables type checking — avoid it entirely.

## Component Patterns

- **Server components by default** — only add `"use client"` when the component needs browser APIs, event handlers, or state.
- **Props typing** — inline by default; switch to `interface Props` (not `type Props`) when readability suffers or the interface is referenced elsewhere. Use judgment.
- **No manual memoization** — React Compiler handles it. Don't add `useMemo`, `useCallback`, or `React.memo`.
- **Always use common components** — never use raw HTML elements when a `src/components/common/` equivalent exists. Use `<Button>` not `<button>`, `<Input>` not `<input>`, `<Label>` not `<label>`, etc. Raw elements bypass the design system (token classes, focus rings, accessibility attributes). The only exceptions are the static prerender gotcha (see below) and cases where `asChild` composition is required.

## Styling

- Prefer Tailwind utility classes for all styling — over inline `style={}`, CSS Modules, or custom CSS. Reserve inline `style={}` only for values computed at runtime that cannot be expressed as a static Tailwind class.
- Biome enforces sorted classes (`useSortedClasses` rule).
- Dark mode is **not supported**. The design system is intentionally light-mode only.
- Design tokens use shadcn's CSS variable naming (`--primary`, `--background`, etc.) with Violet+Stone values, available as Tailwind utilities (e.g., `bg-primary`, `text-muted-foreground`). Supplementary tokens like `bg-cta` and `bg-success` are also available. See "Design Token Usage" below for the full reference.

## Voice & Tone

All UI copy follows the voice and tone rules in `.claude/rules/voice-and-tone.md`. Key points: plain rehearsal-room language, no jargon, no exclamation marks, no emoji, no em dashes. "Production team" for organizer-side users, "candidate" for talent-side users — no synonyms.

## Code Quality (Biome Config)

| Setting | Value |
|---------|-------|
| Indent | 2 spaces |
| Semicolons | as needed (omitted where optional) |
| Arrow parens | always (`(x) => ...`) |
| Bracket spacing | `{ x }` not `{x}` |
| Import organization | automatic (Biome assist) |
| Lint rules | recommended + React/Next.js domains |
| `noConsole` | warn |
| `useSortedClasses` | warn |

## Design Token Usage

Design tokens live in `src/styles/globals.scss`. The primary layer uses **shadcn's CSS variable naming** (`--primary`, `--background`, `--card`, etc.) with Violet+Stone values, available as Tailwind utilities. Supplementary tokens (`--color-cta-*`, `--color-brand-*`, `--color-success-*`, etc.) are declared alongside them in `@theme inline`. See `docs/FEATURES.md#design-system` for architecture rationale.

### Token quick-reference

**shadcn variables** (available as Tailwind utilities via `bg-*`, `text-*`, `border-*`):

| Token | Tailwind class | Use |
|---|---|---|
| `--primary` | `bg-primary` / `text-primary` | Primary buttons, active states |
| `--primary-foreground` | `text-primary-foreground` | Text on primary-colored surfaces |
| `--secondary` | `bg-secondary` | Secondary action surfaces |
| `--muted` | `bg-muted` | Muted/inset areas |
| `--muted-foreground` | `text-muted-foreground` | Secondary/helper text |
| `--accent` | `bg-accent` | Hover and selected-item backgrounds (stone-100) |
| `--card` | `bg-card` | Card and panel surfaces |
| `--background` | `bg-background` | Page canvas |
| `--border` | `border-border` | Default dividers and outlines |
| `--destructive` | `bg-destructive` | Errors, danger actions |
| `--destructive-foreground` | `text-destructive-foreground` | Text on destructive surfaces |

**Supplementary tokens** (declared in `@theme inline` alongside the shadcn vars):

| Token | Tailwind class | Use |
|---|---|---|
| `--color-cta` | `bg-cta` / `text-cta` | Orange CTAs, notification badges |
| `--color-cta-hover` | `bg-cta-hover` | CTA hover state |
| `--color-cta-light` | `bg-cta-light` | CTA badge backgrounds |
| `--color-cta-text` | `text-cta-text` | Inline CTA labels |
| `--color-cta-fg` | `text-cta-fg` | Text/icons on CTA-colored surfaces |
| `--color-brand-hover` | `bg-brand-hover` | Primary button hover (violet-700) |
| `--color-brand-pressed` | `bg-brand-pressed` | Primary button active/pressed (violet-800) |
| `--color-brand-light` | `bg-brand-light` | Badge/chip backgrounds, selection highlight |
| `--color-brand-subtle` | `bg-brand-subtle` | Hover surface tints, nav active bg |
| `--color-brand-text` | `text-brand-text` | Inline brand labels/links |
| `--color-border-brand` | `border-border-brand` | Focus and brand-adjacent borders |
| `--color-success` / `-light` / `-text` | `bg-success`, etc. | Positive status |
| `--color-error` / `-light` / `-text` | `bg-error`, etc. | Errors, destructive actions |
| `--color-warning` / `-light` / `-text` | `bg-warning`, etc. | Cautionary states |

**Text hierarchy** — use semantic tokens, never raw stone palette classes:

| Level | Class |
|---|---|
| Primary | `text-foreground` |
| Muted / secondary | `text-muted-foreground` |

## Component Patterns — Design Token Usage

Standard Tailwind class recipes for common UI elements. Use these patterns consistently across all components.

### Buttons

```
# Primary (shadcn Button — variant="default")
bg-primary hover:bg-brand-hover text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold transition-colors

# Secondary (shadcn Button — variant="secondary")
bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-lg px-4 py-2 text-sm font-semibold transition-colors

# Ghost (shadcn Button — variant="ghost")
hover:bg-accent text-muted-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors

# Destructive (shadcn Button — variant="destructive")
bg-destructive hover:bg-error text-destructive-foreground rounded-lg px-4 py-2 text-sm font-semibold transition-colors

# CTA / Spotlight
bg-cta hover:bg-cta-hover text-cta-fg rounded-lg px-4 py-2 text-sm font-semibold transition-colors
```

**Button icon props** (`src/components/common/button.tsx`):

The `Button` component accepts `leftSection` and `rightSection` props (`ReactNode`) for placing icons or other content on either side of the label. When `loading={true}`, a `Spinner` replaces `leftSection` automatically and `disabled` is set.

```tsx
<Button leftSection={<PlusIcon />}>Add performer</Button>
<Button rightSection={<ArrowRightIcon />}>Continue</Button>
<Button loading={isPending}>Saving...</Button>
```

The `loading` + `leftSection` pattern is the standard way to show async state on action buttons — the spinner occupies the same space as the icon, preventing layout shift.

The `Button` component also accepts an `href` prop. When `href` is provided it renders as a Next.js `Link` instead of a `<button>` element. This works in server components — the landing page at `src/app/page.tsx` uses `<Button href="/auth">` — so you no longer need a styled `<Link>` workaround for navigation buttons in server-rendered pages.

```tsx
// Server component — OK
<Button href="/auth" size="lg">Get Started</Button>

// Use a styled <Link> only when you need full link semantics without button styling
```

### Cards and Panels

```
bg-card border border-border rounded-xl shadow-sm
```

### Inputs

```
bg-background border border-border focus:border-border-brand focus:ring-2 focus:ring-border-brand rounded-lg px-3 py-2 text-sm text-stone-900 placeholder:text-muted-foreground outline-none transition
```

### Sidebar / Nav

```
# Container
bg-sidebar border-r border-sidebar-border

# Active item
bg-brand-subtle text-brand-text font-medium rounded-md

# Inactive item
text-muted-foreground hover:bg-accent hover:text-stone-900 rounded-md
```

### Badges / Status Pills

```
# Brand
bg-brand-light text-brand-text text-xs font-medium rounded-full px-2 py-0.5

# Success
bg-success-light text-success-text text-xs font-medium rounded-full px-2 py-0.5

# Error
bg-error-light text-error-text text-xs font-medium rounded-full px-2 py-0.5

# Warning
bg-warning-light text-warning-text text-xs font-medium rounded-full px-2 py-0.5
```

### Focus Rings

Apply globally to all interactive elements:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

*Note: Inputs intentionally use `focus:ring-border-brand` (violet-300) instead of `ring-ring` — provides sufficient contrast for WCAG 2.1 SC 1.4.11 compliance.*

*Updated: 2026-02-27 — Migrated to shadcn CSS variable naming (--primary, --background, etc.) with Violet+Stone values*

## Icons (Lucide)

All icons use `lucide-react`. No special patterns required — import named components directly and use them anywhere (server or client components, no separate SSR import path).

```tsx
import { Camera, Heart } from "lucide-react"
```

Props: `size` (default `24`), `color` (default `currentColor`), `strokeWidth` (default `2`), `absoluteStrokeWidth`. All standard SVG attributes are also accepted.

Icons are `aria-hidden` by default. Add `aria-label` when the icon conveys meaning without surrounding text:

```tsx
<Check aria-label="Task completed" />
```

## Shared Layout Pattern — Centered Full-Viewport Pages

Pages that need to fill the full viewport and center their content (landing, 404, error pages) use this Tailwind recipe on their `<main>` element:

```
flex min-h-svh flex-col items-center justify-center px-4
```

`min-h-svh` (small viewport height) is used instead of `min-h-screen` to avoid the iOS Safari URL-bar resize glitch.

## Form Patterns

Action-connected forms use a single adapter hook instead of separate `useForm` + `useAction` hooks. This keeps form state and action execution co-located and eliminates manual wiring between the two.

### `useHookFormAction` — standard hook for action-connected forms

```tsx
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { formResolver } from "@/lib/schemas/resolve"

const { form, action, handleSubmitWithAction } = useHookFormAction(
  myAction,
  formResolver(myFormSchema),
  {
    formProps: { defaultValues: { name: "" } },
    actionProps: {
      onSuccess() { /* navigate, refresh, etc. */ },
      onError({ error }) {
        form.setError("root", {
          message: error.serverError ?? "Something went wrong. Try again.",
        })
      },
    },
  },
)
```

The hook returns `form` (a standard `react-hook-form` `UseFormReturn`) and `action` (a `useAction` return with `isPending`, `execute`, etc.). Never combine a separate `useForm` + `useAction` for forms that submit to a `next-safe-action` action.

### Centralized schemas (`src/lib/schemas/`)

All Zod schemas live in `src/lib/schemas/[feature].ts`, not inline in form or action files. The barrel re-exports everything from `src/lib/schemas/index.ts`.

| File | Contents |
|------|----------|
| `src/lib/schemas/slug.ts` | `slugSchema`, `slugSchemaStrict` — reused across form/action schemas |
| `src/lib/schemas/organization.ts` | Org and invite create/update schemas |
| `src/lib/schemas/production.ts` | Production create/update schemas |
| `src/lib/schemas/role.ts` | Role update schemas |
| `src/lib/schemas/submission.ts` | Submission form/action schemas |
| `src/lib/schemas/candidate.ts` | Candidate update schemas |
| `src/lib/schemas/form-fields.ts` | Custom form field add/remove/reorder schemas |

**Form schema vs action schema split.** Every feature defines two schemas:

- **Form schema** — user-input fields only (what the form collects). Used as the `zodResolver` argument.
- **Action schema** — extends the form schema with server-only fields (IDs from props/context) via `.extend()`, and stricter server-side refinements via `.refine()`. Used as the `next-safe-action` `.inputSchema()` argument.

```ts
// src/lib/schemas/submission.ts
export const submissionFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  // ...
})

export const submissionActionSchema = submissionFormSchema.extend({
  orgId: z.string().min(1),       // injected from props, not user input
  productionId: z.string().min(1),
  roleId: z.string().min(1),
})
```

The action file imports and uses `submissionActionSchema`; the form component imports and uses `submissionFormSchema`.

### Submit handlers

**Use `handleSubmitWithAction`** when the form fields exactly match the action input (no ID injection needed):

```tsx
<form onSubmit={handleSubmitWithAction}>
```

**Use `form.handleSubmit((v) => action.execute(...))`** when you need to inject IDs from props or transform values before executing:

```tsx
<form onSubmit={form.handleSubmit((v) => action.execute({ ...v, orgId, roleId }))}>
```

### Loading and error state

- **Loading indicator:** `action.isPending` — not a separate state variable.
- **Validation errors:** Mapped automatically to fields by the adapter via `zodResolver`.
- **Server errors:** Use `form.setError("root", { message: ... })` in `onError`. Display with `form.formState.errors.root`:

```tsx
{form.formState.errors.root && (
  <Alert variant="destructive">
    <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
  </Alert>
)}
```

### Exception: auth forms

Forms that call the Better Auth client SDK directly (`authClient.signIn.email`, `authClient.signUp.email`) don't go through `next-safe-action` and don't use `useHookFormAction`. Standard `useForm` is correct for those. See `src/components/auth/` for examples.

*Updated: 2026-03-04 — Added Form Patterns section (useHookFormAction, centralized schemas, schema split)*
*Updated: 2026-03-04 — Replaced zodResolver-as-any pattern with formResolver from @/lib/schemas/resolve; removed as-any-cast subsection; corrected backend directory example to reflect actual actions/ directories*
*Updated: 2026-03-06 — Added candidate.ts and form-fields.ts to schemas table; fixed voice & tone terminology (performer → candidate)*

## Backend Patterns

### Directory structure

Business logic lives in `src/actions/`, organized by feature area:

```
src/actions/
├── productions/     # Production and role CRUD, pipeline stage management
├── submissions/     # Public submission flow, submission status updates
├── organizations/   # Org management, members, invitations, profiles
├── candidates/      # Candidate queries
└── admin/           # Admin user management
```

### Server actions with next-safe-action (writes)

Any action called from a client component — form submissions, button presses, mutations — uses
`next-safe-action` via the pre-configured clients in `src/lib/action.ts`. This gives us input
validation, auth, logging, and type-safe return values automatically.

```ts
"use server"

import { secureActionClient } from "@/lib/action"
import { z } from "zod/v4"

export const createProduction = secureActionClient
  .metadata({
    action: "create-production",
  })
  .inputSchema(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    })
  )
  .action(async ({ parsedInput: { name, description }, ctx: { user } }) => {
    // Business logic here
  })
```

**Rules:**
- Use `secureActionClient` for any action requiring auth (most actions).
- Use `publicActionClient` only for unauthenticated actions (rare).
- Always provide `metadata({ action: "kebab-case-name" })` for logging/tracing.
- Always provide `.inputSchema()` with a Zod schema for type-safe validation.
- All `z.string()` fields for user-entered text must chain `.trim()` before any other validators (`.min()`, `.email()`, etc.). This strips leading/trailing whitespace before validation so "  alice@example.com  " is accepted. **Exceptions:** passwords, IDs, and tokens — these must not be trimmed.

```ts
// Correct
name: z.string().trim().min(1, "Name is required."),
email: z.string().trim().email("Enter a valid email."),

// Wrong — whitespace not stripped before validation
name: z.string().min(1, "Name is required."),

// Correct exception — passwords must not be trimmed
password: z.string().min(8),
```

### Plain server functions (reads)

Data fetching for server components and pages uses plain `async` functions — no need for
`next-safe-action` overhead on read paths. These run entirely on the server.

```ts
"use server"

import { checkAuth } from "@/lib/auth/auth-util"
import { db } from "@/lib/db/db"

export async function getProductions() {
  const user = await checkAuth()
  // Query and return data
}
```

**Rules:**
- Use `checkAuth()` from `@/lib/auth/auth-util` when the read requires authentication.
- These functions are called directly from server components — no client round-trip.
- Keep reads simple: fetch, transform if needed, return. No side effects.

### Server components first

Prefer server components and pages as the default. Only add `"use client"` when a component
genuinely needs browser APIs, event handlers, or React state. This means:

- Pages that just display data should be server components calling plain server functions.
- Forms and interactive elements that need client-side state use `"use client"` and call
  `next-safe-action` actions.
- Pass server-fetched data down as props rather than fetching in client components when possible.

### Database queries

We use Drizzle ORM for all database access. The relational query API (`db.query`) is
the default for reads — it leverages the relations in `schema.ts` and handles joins via `with`.
Fall back to `db.select()` when the relational API doesn't support what you need (aggregations,
complex cross-join filtering, specific column aliases).

```ts
// Default — relational API
const production = await db.query.Production.findFirst({
  where: (p) => eq(p.id, id),
  with: { roles: true },
})

// Fallback — when relational API can't express the query
const rows = await db.select({ count: count() }).from(Production).where(...)

// Mutations — use the core API
await db.insert(Production).values({ ... })
await db.update(member).set({ role }).where(eq(member.id, memberId))
await db.delete(member).where(eq(member.id, memberId))
```

**Rules:**
- Never write raw SQL. All queries must go through the Drizzle API.
- All table relationships are defined in `src/lib/db/schema.ts` — use `with` to load related data instead of manual joins.
- All database operations must live in `src/actions/` — never query the database directly in page or component files. Even simple reads should be wrapped in a server function under `src/actions/`.
- When a query only needs a few columns, use the `columns` option to limit what's fetched.

## Gotchas

- `next-env.d.ts` is auto-generated by Next.js — don't edit it.
- `bun.lock` is a binary lockfile — don't try to read or edit it.
- React Compiler is experimental (`babel-plugin-react-compiler` 1.0.0) — if you hit odd rendering bugs, check compiler output first.
- Biome's `noUnknownAtRules` is disabled to allow Tailwind v4 directives (`@theme`, `@import "tailwindcss"`).
- **`Button` with `asChild` cannot be used in statically prerendered server components.** The shadcn `Button` with `asChild` imports `Slot` from `@radix-ui/react-slot`, which can trigger "Minified React error #143" during `next build` on statically prerendered pages (e.g., `src/app/not-found.tsx`). For navigation buttons in server-rendered pages, use the `href` prop instead of `asChild` — `<Button href="/auth">` renders as a Next.js `Link` without the `Slot` overhead. Workaround for `not-found.tsx` and similar static pages: use a styled `<Link>` with equivalent Tailwind classes if the `href` prop still causes issues.

*Updated: 2026-02-28 — Added Button leftSection/rightSection props, Zod .trim() rule, common-components-only rule; fixed text hierarchy tokens (semantic tokens replace raw stone palette)*
