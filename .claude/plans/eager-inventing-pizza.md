# Candidate Submission Link & Status Styling Tweaks

## Context

In the candidate detail view, submissions currently show a separate "View in role" link that's disconnected from the role name. The link also uses an outdated URL scheme (`/productions/{id}/roles/{roleId}?submission=...`) — there's no `/roles/[roleId]` route. Additionally, submission status badges across the candidate view and candidates grid are too prominent for what is secondary information.

## Changes

### 1. Candidate Detail — Replace "View in role" with linked role name (`candidate-detail.tsx`)

**Current** (lines 203–218): Header shows `{productionName} — {roleName}` as plain text + a separate "View in role" link with ExternalLinkIcon on the right.

**New**: Make the `{productionName} — {roleName}` text a `<Link>` to `/productions/{productionId}?submission={submissionId}` and add an `ExternalLinkIcon` next to it. Remove the separate "View in role" link entirely.

```tsx
// Before
<p className="font-medium text-foreground text-label">
  {selected.productionName} &mdash; {selected.roleName}
</p>
// ... separate "View in role" link

// After
<Link
  href={`/productions/${selected.productionId}?submission=${submission.id}`}
  className="flex items-center gap-1 font-medium text-foreground text-label transition-colors hover:text-muted-foreground"
>
  {selected.productionName} &mdash; {selected.roleName}
  <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground" />
</Link>
```

### 2. Candidate Detail — Subtler status badges in SubmissionNav (`candidate-detail.tsx`)

**Current** (lines 125–131): Status badges use `text-caption` size with standard badge styling (colored background).

**New**: Switch to a smaller, subtler presentation. Use a dot indicator + text instead of a full badge, or use a ghost/outline badge at a smaller scale. Simplest approach: use `text-[10px]` on the badge or switch to a lighter variant.

Recommended: keep the Badge but add `scale-90 opacity-80` or reduce padding. Alternatively, render as plain text with the stage color as text color (no background).

**Approach**: Render status as plain colored text (no badge background) at `text-caption` size with `text-muted-foreground` for default stages:

```tsx
{row.submission.stage && (
  <span className={cn(
    "shrink-0 text-[11px]",
    row.submission.stage.type === "SELECTED" && "text-success-text",
    row.submission.stage.type === "REJECTED" && "text-destructive",
    (!row.submission.stage.type || row.submission.stage.type === "APPLIED" || row.submission.stage.type === "CUSTOM") && "text-muted-foreground",
  )}>
    {row.submission.stage.name}
  </span>
)}
```

### 3. Candidates Grid — Subtler, right-aligned statuses in CandidateCard (`candidate-card.tsx`)

**Current** (lines 69–88): Each submission row shows `Production / Role` then a Badge. The badge uses standard sizing.

**New**:
- Right-align statuses using `justify-between` on the flex row (already `flex items-center gap-1`)
- Replace the Badge with plain colored text (same approach as #2) to be smaller and subtler
- Use `flex-1 min-w-0` on the role text and `shrink-0` on the status text

```tsx
<div className="flex items-center justify-between gap-1 text-caption">
  <span className="min-w-0 truncate text-muted-foreground">
    {sub.production?.name ?? "Unknown"} / {sub.role?.name ?? "Unknown"}
  </span>
  {sub.stage && (
    <span className={cn(
      "shrink-0 text-[11px]",
      sub.stage.type === "SELECTED" && "text-success-text",
      sub.stage.type === "REJECTED" && "text-destructive",
      (!sub.stage.type || sub.stage.type === "APPLIED" || sub.stage.type === "CUSTOM") && "text-muted-foreground",
    )}>
      {sub.stage.name}
    </span>
  )}
</div>
```

## Files to modify

1. `src/components/candidates/candidate-detail.tsx` — changes #1 and #2
2. `src/components/candidates/candidate-card.tsx` — change #3

## Verification

- `bun run build` — ensure no type/build errors
- Tell user to check:
  - `/candidates/{id}` — role name is now a clickable link with external icon, navigates to correct production URL; status badges in left nav are plain text
  - `/candidates` — grid cards show right-aligned, subtle text statuses instead of badge pills
