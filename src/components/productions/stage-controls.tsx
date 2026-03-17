"use client"

import { ArrowRightLeftIcon, XCircleIcon } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/popover"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"

interface StageControlsProps {
  submission: SubmissionWithCandidate
  pipelineStages: PipelineStageData[]
  onStageChange: (stageId: string) => void
}

export function StageControls({
  submission,
  pipelineStages,
  onStageChange,
}: StageControlsProps) {
  const [stagePopoverOpen, setStagePopoverOpen] = useState(false)

  function handleStatusChange(stageId: string) {
    onStageChange(stageId)
    setStagePopoverOpen(false)
  }

  const rejectedStage = pipelineStages.find((s) => s.type === "REJECTED")
  const isRejected = rejectedStage
    ? submission.stageId === rejectedStage.id
    : false

  return (
    <div className="flex shrink-0 items-center gap-element">
      <Badge variant="outline" className="text-label">
        {submission.stage?.name ?? "Inbound"}
      </Badge>
      <Popover open={stagePopoverOpen} onOpenChange={setStagePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            leftSection={<ArrowRightLeftIcon />}
          >
            Change stage
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1">
          <div className="flex flex-col">
            {pipelineStages
              .filter((stage) => stage.type !== "REJECTED")
              .map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  disabled={stage.id === submission.stageId}
                  onClick={() => handleStatusChange(stage.id)}
                  className="rounded-sm px-2 py-1.5 text-left text-foreground text-label transition-colors hover:bg-muted disabled:text-muted-foreground disabled:opacity-50"
                >
                  {stage.name}
                </button>
              ))}
          </div>
        </PopoverContent>
      </Popover>
      {rejectedStage && (
        <Button
          variant={isRejected ? "destructive" : "outline"}
          size="sm"
          leftSection={<XCircleIcon />}
          onClick={() => {
            if (!isRejected) {
              handleStatusChange(rejectedStage.id)
            }
          }}
          disabled={isRejected}
        >
          {isRejected ? "Rejected" : "Reject"}
        </Button>
      )}
    </div>
  )
}
