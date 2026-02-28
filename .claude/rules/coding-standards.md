# Coding Standards

## Developer Ergonomics First

Optimize for the developer reading the code, not just the machine executing it.
Maintainable, readable, and easy-to-work-with code is the default goal.
When brevity conflicts with clarity, choose clarity.

## Self-Documenting Code

Let naming, structure, and types communicate intent. Add comments only for:

- **Non-obvious logic** — e.g., a workaround for a library or browser quirk
- **Non-conventional patterns** — intentional deviation from the norm (explain why)
- **Especially complex algorithms or state machines**

Don't comment what the code clearly does. Comment *why* it does it.

## Server components first

Default to server components and pages. Only add `"use client"` when a component genuinely
needs browser APIs, event handlers, or React state. Pass server-fetched data down as props
rather than fetching in client components when possible.

## Backend business logic lives in `src/actions/`

Organize by feature area: `src/actions/productions/`, `src/actions/auditions/`, etc.

**Writes (client-callable):** Use `next-safe-action` with `secureActionClient` (or
`publicActionClient` for unauthenticated actions). Always provide `.metadata()` and
`.inputSchema()`:

```ts
export const createProduction = secureActionClient
  .metadata({ action: "create-production" })
  .inputSchema(z.object({ name: z.string().min(1) }))
  .action(async ({ parsedInput: { name }, ctx: { user } }) => {
    // ...
  })
```

**Reads (server-only):** Use plain `async` functions with `checkAuth()` for auth. Called
directly from server components — no `next-safe-action` overhead needed.

```ts
export async function getProductions() {
  const user = await checkAuth()
  // query and return
}
```

See `docs/CONVENTIONS.md#backend-patterns` for the full guide.

## Use dayjs for all date/time work

Never use native `Date` objects or `new Date()`. Use `dayjs` for all date creation,
parsing, formatting, and comparison. Always import from the project wrapper — never
from `"dayjs"` directly — because the wrapper pre-loads required plugins:

```ts
// Correct — uses the project wrapper with plugins pre-loaded
import day from "@/lib/dayjs";

const now = day();
const formatted = day(someDate).format("LL");

// Wrong — native Date
const now = new Date();

// Wrong — imports dayjs directly, missing plugins
import dayjs from "dayjs";
```
