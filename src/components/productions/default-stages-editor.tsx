"use client"

import { move } from "@dnd-kit/helpers"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { GripVerticalIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { addProductionStage } from "@/actions/productions/add-production-stage"
import { removeProductionStage } from "@/actions/productions/remove-production-stage"
import { reorderProductionStages } from "@/actions/productions/reorder-production-stages"
import { Button } from "@/components/common/button"
import { Input } from "@/components/common/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"
import { MAX_PIPELINE_STAGES } from "@/lib/constants"

export interface StageData {
  id: string
  name: string
  order: number
  type: "APPLIED" | "SELECTED" | "REJECTED" | "CUSTOM"
}

function SortableStage({
  stage,
  index,
  onRemove,
  isRemoving,
}: {
  stage: StageData
  index: number
  onRemove: (id: string) => void
  isRemoving?: boolean
}) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: stage.id,
    index,
  })

  return (
    <div
      ref={ref}
      className="flex items-center gap-element px-3 py-1.5"
      style={{ opacity: isDragSource ? 0.4 : 1 }}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label="Drag to reorder"
        className="flex cursor-grab items-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <span className="flex-1 text-foreground text-label">{stage.name}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={() => onRemove(stage.id)}
        disabled={isRemoving}
        tooltip="Remove stage"
      >
        <XIcon className="size-3" />
      </Button>
    </div>
  )
}

function FixedStage({ stage }: { stage: StageData }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-element px-3 py-1.5 text-left"
        >
          <span className="flex-1 text-label text-muted-foreground">
            {stage.name}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Required for all roles</TooltipContent>
    </Tooltip>
  )
}

// --- Controlled StagesEditor (shared between creation form and settings) ---

interface StagesEditorProps {
  stages: StageData[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
  onReorder: (reordered: StageData[]) => void
  isAdding?: boolean
  removingStageId?: string | null
  description?: string
}

export function StagesEditor({
  stages,
  onAdd,
  onRemove,
  onReorder,
  isAdding,
  removingStageId,
  description,
}: StagesEditorProps) {
  const [newStageName, setNewStageName] = useState("")

  const appliedStage = stages.find((s) => s.type === "APPLIED")
  const selectedStage = stages.find((s) => s.type === "SELECTED")
  const rejectedStage = stages.find((s) => s.type === "REJECTED")
  const customStages = stages.filter((s) => s.type === "CUSTOM")

  function handleDragEnd(event: Parameters<DragEndEvent>[0]) {
    if (event.canceled) return

    const reordered = move(customStages, event)
    // Reconstruct the full stages array with system stages
    const allStages = [
      ...(appliedStage ? [appliedStage] : []),
      ...reordered.map((s, i) => ({ ...s, order: i + 1 })),
      ...(selectedStage ? [selectedStage] : []),
      ...(rejectedStage ? [rejectedStage] : []),
    ]
    onReorder(allStages)
  }

  const atLimit = stages.length >= MAX_PIPELINE_STAGES

  function handleAdd() {
    const trimmed = newStageName.trim()
    if (!trimmed || atLimit) return
    onAdd(trimmed)
    setNewStageName("")
  }

  return (
    <div className="flex flex-col gap-group">
      {description && (
        <p className="text-label text-muted-foreground">{description}</p>
      )}

      <div className="flex flex-col rounded-lg border">
        {appliedStage && (
          <div className="border-b bg-muted/50 px-3 py-2">
            <FixedStage stage={appliedStage} />
          </div>
        )}

        <div className="flex flex-col">
          <p className="px-3 pt-2 pb-1 font-medium text-caption text-muted-foreground">
            Custom stages
          </p>
          <DragDropProvider onDragEnd={handleDragEnd}>
            {customStages.map((stage, index) => (
              <SortableStage
                key={stage.id}
                stage={stage}
                index={index}
                onRemove={onRemove}
                isRemoving={removingStageId === stage.id}
              />
            ))}
          </DragDropProvider>

          {customStages.length === 0 && (
            <p className="px-3 py-2 text-caption text-muted-foreground">
              No custom stages yet.
            </p>
          )}

          <div className="flex items-center gap-element border-t px-3 py-2">
            <Input
              type="text"
              placeholder={atLimit ? "Stage limit reached" : "New stage name"}
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              disabled={atLimit}
              className="h-8 flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              loading={isAdding}
              disabled={!newStageName.trim() || atLimit}
            >
              Add
            </Button>
          </div>
        </div>

        {(selectedStage || rejectedStage) && (
          <div className="flex flex-col border-t bg-muted/50 px-3 py-2">
            {selectedStage && <FixedStage stage={selectedStage} />}
            {rejectedStage && <FixedStage stage={rejectedStage} />}
          </div>
        )}
      </div>
    </div>
  )
}

// --- DefaultStagesEditor (settings page wrapper with server actions) ---

interface DefaultStagesEditorProps {
  productionId: string
  stages: StageData[]
}

export function DefaultStagesEditor({
  productionId,
  stages,
}: DefaultStagesEditorProps) {
  const router = useRouter()
  const [localStages, setLocalStages] = useState(stages)

  const { execute: executeReorder } = useAction(reorderProductionStages, {
    onError() {
      router.refresh()
    },
  })

  const { execute: executeAdd, isPending: isAdding } = useAction(
    addProductionStage,
    {
      onSuccess() {
        router.refresh()
      },
    },
  )

  const [removingStageId, setRemovingStageId] = useState<string | null>(null)

  const { execute: executeRemove } = useAction(removeProductionStage, {
    onSuccess() {
      setRemovingStageId(null)
      router.refresh()
    },
    onError() {
      setRemovingStageId(null)
      router.refresh()
    },
  })

  function handleAdd(name: string) {
    executeAdd({ productionId, name })
  }

  function handleRemove(stageId: string) {
    setRemovingStageId(stageId)
    setLocalStages((prev) => prev.filter((s) => s.id !== stageId))
    executeRemove({ productionId, stageId })
  }

  function handleReorder(reordered: StageData[]) {
    setLocalStages(reordered)
    const customIds = reordered
      .filter((s) => s.type === "CUSTOM")
      .map((s) => s.id)
    executeReorder({ productionId, stageIds: customIds })
  }

  return (
    <StagesEditor
      stages={localStages}
      onAdd={handleAdd}
      onRemove={handleRemove}
      onReorder={handleReorder}
      isAdding={isAdding}
      removingStageId={removingStageId}
      description="These are the default casting stages for new roles. Updating them will not change any role pipelines that have already been created."
    />
  )
}
