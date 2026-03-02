---
applyTo: "src/actions/**,src/lib/db/**"
---

# Database Conventions

## All DB Operations Live in `src/actions/`

Never query the database directly in page or component files. Even simple reads
should be wrapped in a server function under `src/actions/`. This keeps all data
access in one place and out of the rendering layer.

## Prefer the Drizzle Relational Query API

Use `db.query` (the relational query API) as the default for reads. It leverages
the relations defined in `schema.ts` and handles joins automatically via `with`.

```ts
// Default — relational API
const production = await db.query.Production.findFirst({
  where: (p) => eq(p.id, id),
  with: { roles: true },
})
```

Fall back to `db.select()` only when the relational API doesn't support what you
need (e.g., aggregations, complex filtering across joins, specific column aliases).

```ts
// Fallback — when relational API can't express the query
const rows = await db.select({ count: count() }).from(Production).where(...)
```

Use `db.insert()` / `db.update()` / `db.delete()` for mutations.

## No Raw SQL

Never write raw SQL. All queries must go through the Drizzle API. If a query seems
impossible to express in Drizzle, flag it and ask before resorting to raw SQL.

## PascalCase Table References

Data tables use PascalCase names (`Production`, `Role`, `Candidate`, `Submission`).
Better Auth tables use lowercase names (`user`, `member`, `organization`) with
PascalCase aliases (`User`, `Member`, `Organization`) — use the PascalCase aliases
when referencing them in data table definitions and relations.

## Server Actions with next-safe-action (Writes)

Any action called from a client component uses `next-safe-action` via the
pre-configured clients in `src/lib/action.ts`:

```ts
"use server"

import { secureActionClient } from "@/lib/action"
import { z } from "zod/v4"

export const createProduction = secureActionClient
  .metadata({ action: "create-production" })
  .inputSchema(
    z.object({
      name: z.string().trim().min(1),
      description: z.string().trim().optional(),
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
- Always provide `.inputSchema()` with a Zod schema.

## Plain Server Functions (Reads)

Data fetching for server components uses plain `async` functions:

```ts
"use server"

import { checkAuth } from "@/lib/auth/auth-util"
import { db } from "@/lib/db/db"

export async function getProductions() {
  const user = await checkAuth()
  // Query and return data
}
```
