---
paths:
  - "src/**/*.ts"
---

# Database Conventions

## All DB operations live in `src/actions/`

Never query the database directly in page or component files. Even simple reads
should be wrapped in a server function under `src/actions/`. This keeps all data
access in one place and out of the rendering layer.

## Prefer the Drizzle relational query API

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

## No raw SQL

Never write raw SQL. All queries must go through the Drizzle API. If a query seems
impossible to express in Drizzle, flag it and ask before resorting to raw SQL.

## PascalCase table references

Data tables use PascalCase names (`Production`, `Role`, `Candidate`, `Submission`).
Better Auth tables use lowercase names (`user`, `member`, `organization`) with
PascalCase aliases (`User`, `Member`, `Organization`) — use the PascalCase aliases
when referencing them in data table definitions and relations.
