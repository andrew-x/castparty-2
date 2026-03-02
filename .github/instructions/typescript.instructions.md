---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript Conventions

## Prefer `interface` over `type`

Use `interface` for object shapes, component props, and API contracts.
Use `type` only when `interface` cannot express it:

- Union types: `type Status = "active" | "inactive"`
- Intersection types built from non-object shapes
- Mapped types and conditional types

## No `any`

Use `unknown` when the type is genuinely unknown, then narrow with guards.
`any` disables type checking — avoid it entirely.

## Self-Documenting Code

Let naming, structure, and types communicate intent. Add comments only for:

- **Non-obvious logic** — e.g., a workaround for a library or browser quirk
- **Non-conventional patterns** — intentional deviation from the norm (explain why)
- **Especially complex algorithms or state machines**

Don't comment what the code clearly does. Comment *why* it does it.

## File & Naming

| What | Convention | Example |
|---|---|---|
| React components | PascalCase | `UserProfile.tsx` |
| Utility modules | camelCase | `formatDate.ts` |
| Route directories | lowercase | `src/app/dashboard/` |
| Style files | kebab-case or `globals.scss` | `globals.scss` |

No barrel files (`index.ts` re-exports). Import from the actual file.

## Code Quality (Biome)

| Setting | Value |
|---|---|
| Indent | 2 spaces |
| Semicolons | as needed (omitted where optional) |
| Arrow parens | always (`(x) => ...`) |
| Bracket spacing | `{ x }` not `{x}` |
| Import organization | automatic (Biome assist) |

## Trim User Text Input

All `z.string()` schemas that accept user text input must include `.trim()` before
validation rules like `.min()` or `.email()`:

```ts
// Correct
name: z.string().trim().min(1, "Name is required.").max(100)
email: z.string().trim().email("Enter a valid email.")

// Wrong
name: z.string().min(1, "Name is required.")
```

**Exceptions (do NOT trim):** passwords, IDs, tokens.

## Use dayjs for Dates

Never use native `Date` objects or `new Date()`. Import from the project wrapper:

```ts
import day from "@/lib/dayjs"

const now = day()
const formatted = day(someDate).format("LL")
```

Never import from `"dayjs"` directly — the wrapper pre-loads required plugins.
