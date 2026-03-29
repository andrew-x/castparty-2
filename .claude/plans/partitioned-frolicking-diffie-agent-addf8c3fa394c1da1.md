# Doc Sync Plan

## Summary of findings

Three docs need targeted edits. All other feature docs (`kanban.md`, `pipeline.md`, `submissions.md`, `reject-reasons.md`, `email.md`, `productions.md`) are accurate against the current codebase.

---

## 1. `docs/ARCHITECTURE.md`

### Change 1a — Data Model: fix Production columns (isOpen → status)

Line 170 currently reads:
```
| `Production` | Organization | `organizationId`, `name`, `slug` (unique per org), `isOpen`, `location`, ...
```

The schema uses `status productionStatusEnum` (enum: `"open"/"closed"/"archive"`), not `isOpen`. Update to reference `status`.

### Change 1b — Data Model: fix Role columns (isOpen → status)

Line 171 currently reads:
```
| `Role` | Production | `productionId`, `name`, `slug` (unique per production), `isOpen`, `description` ...
```

Role now has `status productionStatusEnum` (same enum). Update to reference `status`.

### Change 1c — Directory layout: remove old per-role routes, add new roles route

Lines 38–43 currently document:
```
│   │               └── [roleId]/
│   │                   ├── (role)/  # Route group: shared role layout + sub-nav
│   │                   │   ├── page.tsx           # Role Kanban board
│   │                   │   └── settings/
│   │                   │       └── page.tsx       # General settings only (name, slug, description, open/closed)
│   │                   └── stages/[stageId]/page.tsx  # Stage browse (grid + sort)
```

These routes no longer exist. The actual filesystem has:
```
src/app/(app)/productions/[id]/(production)/roles/page.tsx   ← roles list + inline settings
```

The `(production)` route group section needs to show `roles/page.tsx` instead of the old `roles/[roleId]/(role)/` subtree.

Also update the ARCHITECTURE.md `settings/` sub-tree which still references `open/closed` language — replace with `status`.

### Change 1d — Known Issue #8: mark as fixed

Known Issue #8 reads:
```
| 8 | `src/actions/submissions/get-public-production.ts` | `getPublicProduction` does not filter by `production.isOpen`. ...
```

The actual code (`getPublicProduction`) now checks `if (!production || production.status !== "open") return null` — the issue is fixed. Mark it as resolved with a fix date of 2026-03-29.

### Change 1e — Add update note

Add an `*Updated: 2026-03-29 — ...` line summarising all changes.

---

## 2. `docs/features/README.md`

### Change 2a — Remove stale "Role Settings" entry

Entry currently points to `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/page.tsx`. That route no longer exists. Role settings are now part of the `RolesManager` component on the `/productions/[id]/roles` page. Update the entry point to `src/app/(app)/productions/[id]/(production)/roles/page.tsx`.

### Change 2b — Fix "Role Submissions Kanban" entry

Currently points to `src/app/(app)/productions/[id]/roles/[roleId]/(role)/page.tsx`. The Kanban is now at the production level: `src/app/(app)/productions/[id]/(production)/page.tsx`. Update entry point.

### Change 2c — Remove "Stage Browse" entry

Points to `src/app/(app)/productions/[id]/roles/[roleId]/stages/[stageId]/page.tsx`. This route no longer exists — stage browsing was removed when the board moved to the production level. Remove this row.

---

## 3. No changes needed to other docs

- `kanban.md` — routes already show production-level `/productions/[id]` only. Accurate.
- `productions.md` — already has `status` enum, `open/closed/archive` values, `/productions/[id]/roles` route. Accurate.
- `pipeline.md` — accurate.
- `submissions.md` — already references `status: "open"` checks. Accurate.
- `reject-reasons.md` — accurate.
- `email.md` — accurate.
- `CONVENTIONS.md` — accurate.
- `DECISIONS.md` — accurate.
- `PRODUCT.md` — accurate.
- `INDEX.md` — accurate (no new top-level docs needed).

---

## Execution order

1. Edit `docs/ARCHITECTURE.md` (changes 1a–1e)
2. Edit `docs/features/README.md` (changes 2a–2c)

## Status

- Change 1c (directory layout) — DONE
- Change 1a+1b (Production/Role isOpen → status in data model table) — DONE
- Change 1d (Known Issue #8 fix) — PENDING
- Change 1e (update note) — PENDING
- Changes 2a–2c (features/README.md) — PENDING
