# Seed Data

## Keep seed data in sync with schema

When modifying the database schema (`src/lib/db/schema.ts`) or changing entity
fields/types (`src/lib/types.ts`), update the seed data generator at
`src/actions/admin/seed-data.ts` to include the new or changed fields with
representative fake data.

Specifically:

- **New column on an existing table** — add a faker-generated value in the
  corresponding `tx.insert()` call.
- **New table** — add a generation block in dependency order within the transaction.
- **Changed JSONB shape** (e.g., `CustomForm`, `SystemFieldConfig`) — update the
  helper functions that build those objects.
- **New enum value** — add it to the relevant constant array so it appears in seeded data.
- **Removed column/table** — remove the corresponding generation code.
