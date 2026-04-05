# Split User Name — Plan Summary

**Spec:** `docs/superpowers/specs/2026-04-05-split-user-name-design.md`
**Full plan:** `docs/superpowers/plans/2026-04-05-split-user-name.md`

## Goal

Replace the single user `name` field with separate `firstName` and `lastName` fields using Better Auth's `additionalFields`. The built-in `name` column stays as a computed concatenation for Better Auth compatibility.

## Tasks (8)

1. **Database schema + Better Auth config + auth client** — Add `firstName`/`lastName` columns to Drizzle schema, add `additionalFields` to auth config, update email callbacks to use `firstName`, add `inferAdditionalFields` to client
2. **Signup schema + form** — Replace `name` with `firstName`/`lastName` in Zod schema and signup form
3. **Admin create user** — Update action schema and add-user dialog with two name fields
4. **Navigation display** — Update app layout, TopNav, and OrgSwitcher to use `firstName`/`lastName`
5. **Home page + admin display** — Update greeting, admin users table, change-password dialog, delete-user dialog, impersonation banner
6. **Organization members** — Update `get-organization` query to select `firstName`/`lastName` and compute `userName` string
7. **Seed data** — Update dev user constants and signup call
8. **Migration + lint** — Generate Drizzle migration, edit for safe 3-step data migration, lint, build

## Agents

- **Subagent per task** (recommended) via `superpowers:subagent-driven-development`
- Alternatively: inline execution via `superpowers:executing-plans`
- **Code reviewer** agent after all tasks complete
- **Librarian** agent to update docs after implementation

## Verification

- `bun run build` passes after each task
- `bun run lint` passes at the end
- `bunx drizzle-kit generate` produces valid migration
- Manual checks: signup form, admin UI, home greeting, nav avatar, member list, seed data
