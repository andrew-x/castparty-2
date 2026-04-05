# Submissions Table View — Plan Summary

## Context
The submissions board has grid and compact views but lacks a dense, scannable table layout. Adding a table view grouped by stage with accordion sections gives casting directors a spreadsheet-like experience while reusing existing drag-and-drop and stage-change workflows.

## Approach
Extend the view mode state from a boolean to a three-value union (`"grid" | "compact" | "table"`). Create a new `SubmissionTableView` component that renders inside the existing `DragDropProvider`, reusing all shared state. Extract a `handleStageChange` helper for dropdown-triggered stage changes.

## Files
- **Create:** `src/components/productions/submission-table-view.tsx` — accordion sections per stage, table rows with dnd, stage dropdown, checkboxes, headshot thumbnails
- **Modify:** `src/components/productions/production-submissions.tsx` — viewMode union, third toggle, handleStageChange helper, conditional render

## Tasks (4 code + 1 verification)
1. Refactor `compact` boolean → `viewMode` union, update toggle group
2. Add `handleStageChange` helper (optimistic updates + reject/select dialog triggers)
3. Create `SubmissionTableView` component (accordion + table + dnd + stage dropdown)
4. Wire `SubmissionTableView` into `production-submissions.tsx`
5. Manual verification checklist

## Full Plan
`docs/superpowers/plans/2026-04-05-submissions-table-view.md`
