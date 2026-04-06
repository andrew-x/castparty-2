"use client"

import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  SearchIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { Input } from "@/components/common/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/common/tabs"
import day from "@/lib/dayjs"
import { cn } from "@/lib/util"

interface Production {
  id: string
  name: string
  status: "open" | "closed" | "archive"
  createdAt: Date
  roleCount: number
  submissionCount: number
}

const statusOrder: Record<string, number> = {
  open: 0,
  closed: 1,
  archive: 2,
}

const col = createColumnHelper<Production>()

const columns = [
  col.accessor("name", {
    header: "Name",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  col.accessor("status", {
    header: "Status",
    sortingFn: (a, b) =>
      (statusOrder[a.original.status] ?? 3) -
      (statusOrder[b.original.status] ?? 3),
    filterFn: (row, _columnId, filterValue: string) =>
      row.original.status === filterValue,
    cell: (info) => {
      const status = info.getValue()
      const label =
        status === "archive"
          ? "Archived"
          : status === "open"
            ? "Open"
            : "Closed"
      const variant =
        status === "open"
          ? "default"
          : status === "closed"
            ? "secondary"
            : "outline"
      return (
        <Badge
          variant={variant}
          className={status === "archive" ? "opacity-60" : undefined}
        >
          {label}
        </Badge>
      )
    },
  }),
  col.accessor("roleCount", {
    header: "Roles",
    cell: (info) => info.getValue(),
  }),
  col.accessor("submissionCount", {
    header: "Submissions",
    cell: (info) => info.getValue(),
  }),
  col.accessor("createdAt", {
    header: "Created",
    cell: (info) => day(info.getValue()).format("LL"),
  }),
]

interface Props {
  productions: Production[]
}

type StatusFilter = "all" | "open" | "closed" | "archive"

export function ProductionsTable({ productions }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([
    { id: "status", desc: false },
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  function handleStatusFilter(value: StatusFilter) {
    setStatusFilter(value)
    setColumnFilters(value === "all" ? [] : [{ id: "status", value }])
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const table = useReactTable({
    data: productions,
    columns,
    state: { sorting, globalFilter: search, columnFilters, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: (updater) => {
      setSearch(updater)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue: string) =>
      row.original.name.toLowerCase().includes(filterValue.toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const hasFilters = search !== "" || statusFilter !== "all"

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-block">
      <div className="flex items-center gap-block">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs
          value={statusFilter}
          onValueChange={(v) => handleStatusFilter(v as StatusFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
            <TabsTrigger value="archive">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    header.column.getCanSort()
                      ? "cursor-pointer select-none"
                      : undefined
                  }
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="inline-flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {header.column.getCanSort() &&
                      (header.column.getIsSorted() === "asc" ? (
                        <ArrowUpIcon className="size-3.5" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ArrowDownIcon className="size-3.5" />
                      ) : (
                        <ChevronsUpDownIcon className="size-3.5 text-muted-foreground/50" />
                      ))}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {hasFilters
                  ? "No productions match your filters."
                  : "No productions yet."}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "cursor-pointer",
                  row.original.status === "archive" && "opacity-60",
                )}
                onClick={() => router.push(`/productions/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-caption text-muted-foreground">
            {filteredCount} {filteredCount === 1 ? "production" : "productions"}
          </p>
          <div className="flex items-center gap-element">
            <Button
              variant="outline"
              size="sm"
              leftSection={<ChevronLeftIcon />}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-caption text-muted-foreground">
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              rightSection={<ChevronRightIcon />}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
