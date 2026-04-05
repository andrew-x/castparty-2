"use client"

import { CollisionPriority } from "@dnd-kit/abstract"
import { useDroppable } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
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
  showRoleName: boolean
  onSelect: (submission: SubmissionWithCandidate) => void
  onToggle: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: (ids: string[]) => void
  onStageChange: (submissionId: string, targetStageId: string) => void
}

const COL_WIDTHS = {
  drag: "w-10",
  checkbox: "w-10",
  role: "w-1/5",
  stage: "w-36",
  submitted: "w-32",
}

export function SubmissionTableView({
  pipelineStages,
  filteredColumns,
  searchActive,
  selectedIds,
  pendingSubmissionId,
  showRoleName,
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
              showRoleName={showRoleName}
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

interface StageAccordionProps {
  stage: PipelineStageData
  items: SubmissionWithCandidate[]
  pipelineStages: PipelineStageData[]
  searchActive: boolean
  selectedIds: Set<string>
  pendingSubmissionId: string | null
  showRoleName: boolean
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
  showRoleName,
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
              <col className={COL_WIDTHS.drag} />
              <col className={COL_WIDTHS.checkbox} />
              <col />
              <col className={COL_WIDTHS.role} />
              <col className={COL_WIDTHS.stage} />
              <col className={COL_WIDTHS.submitted} />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead aria-label="Reorder" />
                <TableHead aria-label="Select" />
                <TableHead className="text-caption">Name</TableHead>
                <TableHead className="text-caption">Role</TableHead>
                <TableHead className="text-caption">Stage</TableHead>
                <TableHead className="text-caption">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((submission, index) => (
                <SubmissionRow
                  key={submission.id}
                  submission={submission}
                  index={index}
                  stageId={stage.id}
                  pipelineStages={pipelineStages}
                  isChecked={selectedIds.has(submission.id)}
                  isPending={submission.id === pendingSubmissionId}
                  showRoleName={showRoleName}
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

interface SubmissionRowProps {
  submission: SubmissionWithCandidate
  index: number
  stageId: string
  pipelineStages: PipelineStageData[]
  isChecked: boolean
  isPending: boolean
  showRoleName: boolean
  onSelect: (submission: SubmissionWithCandidate) => void
  onToggle: (id: string) => void
  onStageChange: (submissionId: string, targetStageId: string) => void
}

function SubmissionRow({
  submission,
  index,
  stageId,
  pipelineStages,
  isChecked,
  isPending,
  showRoleName,
  onSelect,
  onToggle,
  onStageChange,
}: SubmissionRowProps) {
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
        {showRoleName ? submission.roleName || "-" : "-"}
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
