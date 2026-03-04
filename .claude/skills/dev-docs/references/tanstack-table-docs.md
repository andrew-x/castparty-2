# @tanstack/react-table — Documentation Index

Source: https://tanstack.com/table/latest
Type: doc-site index (no llms.txt available — manually curated)
Added: 2026-03-04

Headless, framework-agnostic table/datagrid library with a first-class React adapter.
Provides hooks for building fully custom table UIs with sorting, filtering, pagination,
row selection, column ordering, pinning, grouping, expanding, and virtualization.

## How to use this file

This is a page index, not documentation itself. Find the page that covers your
question, then `WebFetch` that URL with a focused extraction prompt. Pages are
typically one concept each.

---

## Getting Started

- [Introduction](https://tanstack.com/table/latest/docs/introduction): What TanStack Table is, why it exists, and its headless/framework-agnostic design philosophy.
- [Overview](https://tanstack.com/table/latest/docs/overview): Core objects and types (Table, Column, Row, Cell, Header), TypeScript generics, and the headless rendering model.
- [Installation](https://tanstack.com/table/latest/docs/installation): Install commands for each framework adapter (use the React section).
- [Migration Guide](https://tanstack.com/table/latest/docs/guide/migrating): Migrating from react-table v7 to TanStack Table v8.
- [FAQ](https://tanstack.com/table/latest/docs/faq): Frequently asked questions and common issues.

## Guides (Framework-Agnostic)

Core concepts that apply regardless of framework.

- [Data](https://tanstack.com/table/latest/docs/guide/data): How to provide data to the table, data types, and the data lifecycle.
- [Tables](https://tanstack.com/table/latest/docs/guide/tables): Creating and configuring the table instance, table options, and table state.
- [Columns](https://tanstack.com/table/latest/docs/guide/columns): Column objects, accessing columns, and the column API.
- [Column Definitions](https://tanstack.com/table/latest/docs/guide/column-defs): Defining columns with accessors, display columns, and grouping columns.
- [Rows](https://tanstack.com/table/latest/docs/guide/rows): Row objects, row API, and accessing row data.
- [Row Models](https://tanstack.com/table/latest/docs/guide/row-models): How row models work — core, filtered, sorted, grouped, expanded, paginated, and faceted.
- [Cells](https://tanstack.com/table/latest/docs/guide/cells): Cell objects, rendering cells, and the cell API.
- [Headers](https://tanstack.com/table/latest/docs/guide/headers): Header objects, rendering headers, and the header API.
- [Header Groups](https://tanstack.com/table/latest/docs/guide/header-groups): Multi-row header groups for grouped/nested column layouts.
- [Features](https://tanstack.com/table/latest/docs/guide/features): Overview of all built-in features and how the feature system works.
- [Custom Features](https://tanstack.com/table/latest/docs/guide/custom-features): Extending TanStack Table with custom feature plugins.

## Guides — Features

Each feature guide explains concepts, options, and usage patterns.

- [Sorting](https://tanstack.com/table/latest/docs/guide/sorting): Column sorting — single/multi-sort, sort direction, custom sort functions, manual sorting.
- [Column Filtering](https://tanstack.com/table/latest/docs/guide/column-filtering): Per-column filters — filter functions, custom filters, manual filtering.
- [Global Filtering](https://tanstack.com/table/latest/docs/guide/global-filtering): Table-wide search filtering across all or specific columns.
- [Fuzzy Filtering](https://tanstack.com/table/latest/docs/guide/fuzzy-filtering): Fuzzy/ranked matching with custom filter and sort functions.
- [Column Faceting](https://tanstack.com/table/latest/docs/guide/column-faceting): Extracting unique values and min/max ranges from column data for filter UIs.
- [Global Faceting](https://tanstack.com/table/latest/docs/guide/global-faceting): Faceting across all columns for global filter UIs.
- [Pagination](https://tanstack.com/table/latest/docs/guide/pagination): Client-side and server-side pagination — page size, page index, page count.
- [Row Selection](https://tanstack.com/table/latest/docs/guide/row-selection): Single and multi-row selection with checkboxes, toggle behavior, and selection state.
- [Expanding](https://tanstack.com/table/latest/docs/guide/expanding): Expanding rows to show sub-rows or sub-components.
- [Grouping](https://tanstack.com/table/latest/docs/guide/grouping): Grouping rows by column values with aggregation functions.
- [Column Ordering](https://tanstack.com/table/latest/docs/guide/column-ordering): Reordering columns programmatically via state.
- [Column Pinning](https://tanstack.com/table/latest/docs/guide/column-pinning): Pinning columns to left/right edges of the table.
- [Column Sizing](https://tanstack.com/table/latest/docs/guide/column-sizing): Controlling column widths — min, max, default sizes, and resizing.
- [Column Visibility](https://tanstack.com/table/latest/docs/guide/column-visibility): Showing/hiding columns with visibility state.
- [Row Pinning](https://tanstack.com/table/latest/docs/guide/row-pinning): Pinning rows to top/bottom of the table.
- [Virtualization](https://tanstack.com/table/latest/docs/guide/virtualization): Virtualizing large datasets with @tanstack/react-virtual integration.

## API Reference — Core

Type definitions, options, and methods for core table objects.

- [Table API](https://tanstack.com/table/latest/docs/api/core/table): Table instance options, methods, and state management API.
- [Column Def API](https://tanstack.com/table/latest/docs/api/core/column-def): Column definition types — accessor columns, display columns, group columns, and all column options.
- [Column API](https://tanstack.com/table/latest/docs/api/core/column): Column instance properties and methods.
- [Row API](https://tanstack.com/table/latest/docs/api/core/row): Row instance properties and methods.
- [Cell API](https://tanstack.com/table/latest/docs/api/core/cell): Cell instance properties and rendering methods.
- [Header API](https://tanstack.com/table/latest/docs/api/core/header): Header instance properties, methods, and rendering.
- [Header Group API](https://tanstack.com/table/latest/docs/api/core/header-group): Header group (row of headers) properties.

## API Reference — Features

API details for each built-in feature (options, state, methods).

- [Sorting API](https://tanstack.com/table/latest/docs/api/features/sorting): Sorting options, state shape, column methods, and table methods.
- [Column Filtering API](https://tanstack.com/table/latest/docs/api/features/column-filtering): Column filter options, state, filter functions, and methods.
- [Global Filtering API](https://tanstack.com/table/latest/docs/api/features/global-filtering): Global filter options, state, and methods.
- [Column Faceting API](https://tanstack.com/table/latest/docs/api/features/column-faceting): Faceting methods for unique values and min/max ranges.
- [Global Faceting API](https://tanstack.com/table/latest/docs/api/features/global-faceting): Global faceting methods.
- [Pagination API](https://tanstack.com/table/latest/docs/api/features/pagination): Pagination options, state, and navigation methods.
- [Row Selection API](https://tanstack.com/table/latest/docs/api/features/row-selection): Selection options, state, row methods, and table methods.
- [Expanding API](https://tanstack.com/table/latest/docs/api/features/expanding): Expanding options, state, and methods for row expansion.
- [Grouping API](https://tanstack.com/table/latest/docs/api/features/grouping): Grouping options, state, aggregation functions, and methods.
- [Column Ordering API](https://tanstack.com/table/latest/docs/api/features/column-ordering): Column order state and methods.
- [Column Pinning API](https://tanstack.com/table/latest/docs/api/features/column-pinning): Column pinning options, state, and methods.
- [Column Sizing API](https://tanstack.com/table/latest/docs/api/features/column-sizing): Column sizing options, state, resize handlers, and methods.
- [Column Visibility API](https://tanstack.com/table/latest/docs/api/features/column-visibility): Visibility options, state, and toggle methods.
- [Row Pinning API](https://tanstack.com/table/latest/docs/api/features/row-pinning): Row pinning options, state, and methods.

## React Adapter

React-specific docs — hooks, state management, and examples.

- [React Table (useReactTable)](https://tanstack.com/table/latest/docs/framework/react/react-table): The `useReactTable` hook — React adapter API, options, and how to create a table instance in React.
- [React Table State Guide](https://tanstack.com/table/latest/docs/framework/react/guide/table-state): Managing table state in React — controlled vs. uncontrolled state, state updaters, and React integration patterns.

## React Examples

Live examples demonstrating each feature in React.

- [Basic](https://tanstack.com/table/latest/docs/framework/react/examples/basic): Minimal table with typed column definitions and `useReactTable`.
- [Column Groups](https://tanstack.com/table/latest/docs/framework/react/examples/column-groups): Grouped/nested column headers.
- [Sorting](https://tanstack.com/table/latest/docs/framework/react/examples/sorting): Sortable columns with toggle sort handlers.
- [Filters](https://tanstack.com/table/latest/docs/framework/react/examples/filters): Column filtering with text and select inputs.
- [Filters (Faceted)](https://tanstack.com/table/latest/docs/framework/react/examples/filters-faceted): Faceted filter UI with unique values and ranges.
- [Filters (Fuzzy)](https://tanstack.com/table/latest/docs/framework/react/examples/filters-fuzzy): Fuzzy search/filtering with ranking.
- [Pagination](https://tanstack.com/table/latest/docs/framework/react/examples/pagination): Client-side pagination with page controls.
- [Pagination (Controlled)](https://tanstack.com/table/latest/docs/framework/react/examples/pagination-controlled): Server-side / controlled pagination.
- [Pagination (Material UI)](https://tanstack.com/table/latest/docs/framework/react/examples/material-ui-pagination): Pagination integrated with Material UI components.
- [Row Selection](https://tanstack.com/table/latest/docs/framework/react/examples/row-selection): Checkbox-based row selection.
- [Expanding](https://tanstack.com/table/latest/docs/framework/react/examples/expanding): Expandable rows with sub-rows.
- [Sub-Components](https://tanstack.com/table/latest/docs/framework/react/examples/sub-components): Rendering custom sub-components in expanded rows.
- [Grouping](https://tanstack.com/table/latest/docs/framework/react/examples/grouping): Row grouping with aggregation.
- [Column Ordering](https://tanstack.com/table/latest/docs/framework/react/examples/column-ordering): Drag or programmatic column reordering.
- [Column Pinning](https://tanstack.com/table/latest/docs/framework/react/examples/column-pinning): Pinning columns to left/right.
- [Column Pinning (Sticky)](https://tanstack.com/table/latest/docs/framework/react/examples/column-pinning-sticky): Sticky pinned columns with CSS position.
- [Column Sizing](https://tanstack.com/table/latest/docs/framework/react/examples/column-sizing): Resizable columns with drag handles.
- [Column Resizing (Performant)](https://tanstack.com/table/latest/docs/framework/react/examples/column-resizing-performant): High-performance column resizing with CSS variables.
- [Column Visibility](https://tanstack.com/table/latest/docs/framework/react/examples/column-visibility): Toggling column visibility.
- [Column DnD](https://tanstack.com/table/latest/docs/framework/react/examples/column-dnd): Drag-and-drop column reordering.
- [Row DnD](https://tanstack.com/table/latest/docs/framework/react/examples/row-dnd): Drag-and-drop row reordering.
- [Row Pinning](https://tanstack.com/table/latest/docs/framework/react/examples/row-pinning): Pinning rows to top/bottom.
- [Editable Data](https://tanstack.com/table/latest/docs/framework/react/examples/editable-data): Inline cell editing.
- [Custom Features](https://tanstack.com/table/latest/docs/framework/react/examples/custom-features): Creating and using custom table feature plugins.
- [Fully Controlled](https://tanstack.com/table/latest/docs/framework/react/examples/fully-controlled): Fully controlled table state from React state.
- [Full-Width Table](https://tanstack.com/table/latest/docs/framework/react/examples/full-width-table): Table that spans the full container width.
- [Full-Width Resizable Table](https://tanstack.com/table/latest/docs/framework/react/examples/full-width-resizable-table): Full-width table with resizable columns.
- [Query Router Search Params](https://tanstack.com/table/latest/docs/framework/react/examples/query-router-search-params): Syncing table state with URL search params via TanStack Router.
- [Bootstrap](https://tanstack.com/table/latest/docs/framework/react/examples/bootstrap): Table styled with Bootstrap CSS.
- [Kitchen Sink](https://tanstack.com/table/latest/docs/framework/react/examples/kitchen-sink): All features combined in one example.
- [Virtualized Rows](https://tanstack.com/table/latest/docs/framework/react/examples/virtualized-rows): Row virtualization with @tanstack/react-virtual.
- [Virtualized Rows (Experimental)](https://tanstack.com/table/latest/docs/framework/react/examples/virtualized-rows-experimental): Experimental row virtualization approach.
- [Virtualized Columns](https://tanstack.com/table/latest/docs/framework/react/examples/virtualized-columns): Column virtualization.
- [Virtualized Columns (Experimental)](https://tanstack.com/table/latest/docs/framework/react/examples/virtualized-columns-experimental): Experimental column virtualization approach.
- [Virtualized Infinite Scrolling](https://tanstack.com/table/latest/docs/framework/react/examples/virtualized-infinite-scrolling): Infinite scrolling with virtualization and data fetching.
