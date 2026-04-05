"use client"

import { CollisionPriority } from "@dnd-kit/abstract"
import { useDroppable } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { GripVerticalIcon } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/common/accordion"
import { Badge } from "@/components/common/badge"
import { Checkbox } from "@/components/common/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/table"
import day from "@/lib/dayjs"
import type {
  ColumnItems,
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import { cn } from "@/lib/util"

interface Props {
  pipelineStages: PipelineStageData[]
  filteredColumns: ColumnItems
  searchActive: boolean
  selectedIds: Set<string>
  pendingSubmissionId: string | null
  onSelect: (submission: SubmissionWithCandidate) => void
  onToggle: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: (ids: string[]) => void
  onStageChange: (submissionId: string, targetStageId: string) => void
}

export function SubmissionTableView({
  pipelineStages,
  filteredColumns,
  searchActive,
  selectedIds,
  pendingSubmissionId,
  onSelect,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onStageChange,
}: Props) {
  const defaultExpanded = pipelineStages.map((s) => s.id)

  return (
    <div className="mx-auto w-full max-w-5xl px-block">
      <Accordion type="multiple" defaultValue={defaultExpanded}>
        {pipelineStages.map((stage) => {
          const items = filteredColumns[stage.id] ?? []
          return (
            <StageAccordion
              key={stage.id}
              stage={stage}
              items={items}
              pipelineStages={pipelineStages}
              searchActive={searchActive}
              selectedIds={selectedIds}
              pendingSubmissionId={pendingSubmissionId}
              onSelect={onSelect}
              onToggle={onToggle}
              onSelectAll={onSelectAll}
              onDeselectAll={onDeselectAll}
              onStageChange={onStageChange}
            />
          )
        })}
      </Accordion>
    </div>
  )
}

// -- Column definitions (stable, defined once at module level) --

const col = createColumnHelper<SubmissionWithCandidate>()

const columns = [
  col.display({
    id: "drag",
    size: 40,
    header: () => <span className="sr-only">Reorder</span>,
    cell: () => null, // rendered by DraggableRow
  }),
  col.display({
    id: "select",
    size: 40,
    header: () => <span className="sr-only">Select</span>,
    cell: () => null, // rendered by DraggableRow
  }),
  col.accessor((row) => `${row.firstName} ${row.lastName}`, {
    id: "name",
    header: "Name",
    cell: () => null, // rendered by DraggableRow
  }),
  col.accessor("roleName", {
    id: "role",
    header: "Role",
    size: 160,
    cell: () => null, // rendered by DraggableRow
  }),
  col.display({
    id: "stage",
    header: "Stage",
    size: 144,
    cell: () => null, // rendered by DraggableRow
  }),
  col.accessor("createdAt", {
    id: "submitted",
    header: "Submitted",
    size: 128,
    cell: () => null, // rendered by DraggableRow
  }),
]

// -- Stage accordion (droppable zone + table) --

interface StageAccordionProps {
  stage: PipelineStageData
  items: SubmissionWithCandidate[]
  pipelineStages: PipelineStageData[]
  searchActive: boolean
  selectedIds: Set<string>
  pendingSubmissionId: string | null
  onSelect: (submission: SubmissionWithCandidate) => void
  onToggle: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: (ids: string[]) => void
  onStageChange: (submissionId: string, targetStageId: string) => void
}

function StageAccordion({
  stage,
  items,
  pipelineStages,
  searchActive,
  selectedIds,
  pendingSubmissionId,
  onSelect,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onStageChange,
}: StageAccordionProps) {
  const { ref } = useDroppable({
    id: stage.id,
    type: "column",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  })

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  const columnIds = items.map((item) => item.id)
  const selectedInColumn = columnIds.filter((id) => selectedIds.has(id))
  const allSelected =
    items.length > 0 && selectedInColumn.length === items.length
  const someSelected = selectedInColumn.length > 0 && !allSelected

  const headerCheckboxState: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false

  function handleHeaderCheckboxChange() {
    if (allSelected || someSelected) {
      onDeselectAll(columnIds)
    } else {
      onSelectAll(columnIds)
    }
  }

  return (
    <AccordionItem value={stage.id} ref={ref}>
      <AccordionTrigger className="gap-element">
        <div className="flex items-center gap-element">
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops click from toggling accordion; Checkbox inside handles all keyboard interaction */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: stops click from toggling accordion; Checkbox inside handles all keyboard interaction */}
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={headerCheckboxState}
              onCheckedChange={handleHeaderCheckboxChange}
              aria-label={`Select all in ${stage.name}`}
            />
          </div>
          <span className="font-medium text-foreground">{stage.name}</span>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-caption text-muted-foreground">
            {searchActive ? "No matches" : "No candidates"}
          </p>
        ) : (
          <Table>
            <colgroup>
              {table.getAllColumns().map((column) => (
                <col
                  key={column.id}
                  style={
                    column.getSize() !== 150
                      ? { width: column.getSize() }
                      : undefined
                  }
                />
              ))}
            </colgroup>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-caption">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <DraggableRow
                  key={row.id}
                  submission={row.original}
                  index={row.index}
                  stageId={stage.id}
                  pipelineStages={pipelineStages}
                  isChecked={selectedIds.has(row.id)}
                  isPending={row.id === pendingSubmissionId}
                  onSelect={onSelect}
                  onToggle={onToggle}
                  onStageChange={onStageChange}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

// -- Draggable table row --

interface DraggableRowProps {
  submission: SubmissionWithCandidate
  index: number
  stageId: string
  pipelineStages: PipelineStageData[]
  isChecked: boolean
  isPending: boolean
  onSelect: (submission: SubmissionWithCandidate) => void
  onToggle: (id: string) => void
  onStageChange: (submissionId: string, targetStageId: string) => void
}

function DraggableRow({
  submission,
  index,
  stageId,
  pipelineStages,
  isChecked,
  isPending,
  onSelect,
  onToggle,
  onStageChange,
}: DraggableRowProps) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: submission.id,
    index,
    type: "item",
    accept: "item",
    group: stageId,
  })

  const headshotUrl = submission.headshots[0]?.url

  return (
    <TableRow
      ref={ref}
      className={cn(
        "group",
        isDragSource && "opacity-40",
        isPending && "pointer-events-none animate-pulse",
        isChecked && "bg-brand-subtle",
      )}
    >
      {/* Drag handle */}
      <TableCell>
        <div
          ref={handleRef}
          className="flex cursor-grab items-center justify-center rounded-sm p-0.5 opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
        >
          <GripVerticalIcon className="size-3.5 text-muted-foreground" />
        </div>
      </TableCell>

      {/* Checkbox */}
      <TableCell>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => onToggle(submission.id)}
            aria-label={`Select ${submission.firstName} ${submission.lastName}`}
          />
        </div>
      </TableCell>

      {/* Name with headshot thumbnail */}
      <TableCell>
        <button
          type="button"
          onClick={() => onSelect(submission)}
          className="flex items-center gap-element"
        >
          <div className="size-7 shrink-0 overflow-hidden rounded-full bg-muted">
            {headshotUrl ? (
              // biome-ignore lint/performance/noImgElement: external R2 URLs
              <img
                src={headshotUrl}
                alt={`${submission.firstName} ${submission.lastName}`}
                className="size-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-medium text-caption text-muted-foreground">
                  {submission.firstName.charAt(0)}
                  {submission.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <span className="font-medium text-foreground text-label">
            {submission.firstName} {submission.lastName}
          </span>
        </button>
      </TableCell>

      {/* Role */}
      <TableCell className="text-label text-muted-foreground">
        {submission.roleName || "-"}
      </TableCell>

      {/* Stage dropdown */}
      <TableCell>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops pointer-down from reaching dnd-kit */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: stops pointer-down from reaching dnd-kit */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Select
            value={submission.stageId}
            onValueChange={(value) => onStageChange(submission.id, value)}
          >
            <SelectTrigger size="sm" className="text-caption">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelineStages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TableCell>

      {/* Submitted date */}
      <TableCell className="text-label text-muted-foreground">
        {day(submission.createdAt).format("ll")}
      </TableCell>
    </TableRow>
  )
}
