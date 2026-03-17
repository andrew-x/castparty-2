"use client"

import { ChevronDownIcon, ScaleIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/common/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/popover"
import type { PipelineStageData } from "@/lib/submission-helpers"

interface Props {
  selectedCount: number
  pipelineStages: PipelineStageData[]
  isBulkMovePending: boolean
  onMove: (stageId: string) => void
  onCompare: () => void
  onClear: () => void
}

export function BulkActionBar({
  selectedCount,
  pipelineStages,
  isBulkMovePending,
  onMove,
  onCompare,
  onClear,
}: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  return (
    <div className="fade-in slide-in-from-bottom-2 fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-block rounded-lg border border-border bg-card px-block py-element shadow-lg">
      <span className="text-label text-muted-foreground">
        {selectedCount} selected
      </span>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            loading={isBulkMovePending}
            rightSection={<ChevronDownIcon />}
          >
            Move to
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-48 p-1">
          <div className="flex flex-col">
            {pipelineStages.map((stage) => (
              <Button
                key={stage.id}
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setPopoverOpen(false)
                  onMove(stage.id)
                }}
              >
                {stage.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        leftSection={<ScaleIcon />}
        disabled={selectedCount < 2}
        tooltip={
          selectedCount < 2
            ? "Select at least 2 to compare"
            : "Compare candidates"
        }
        onClick={onCompare}
      >
        Compare
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        tooltip="Clear selection"
        onClick={onClear}
      >
        <XIcon />
      </Button>
    </div>
  )
}
