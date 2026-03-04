"use client"

import { PlusIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { addPipelineStage } from "@/actions/productions/add-pipeline-stage"
import { removePipelineStage } from "@/actions/productions/remove-pipeline-stage"
import { Button } from "@/components/common/button"
import { Input } from "@/components/common/input"
import type { PipelineStageData } from "@/lib/submission-helpers"

interface Props {
  roleId: string
  stages: PipelineStageData[]
}

export function RoleStagesEditor({ roleId, stages }: Props) {
  const router = useRouter()
  const [newStageName, setNewStageName] = useState("")

  const { execute: executeAdd, isPending: isAdding } = useAction(
    addPipelineStage,
    {
      onSuccess() {
        setNewStageName("")
        router.refresh()
      },
    },
  )

  const { execute: executeRemove } = useAction(removePipelineStage, {
    onSuccess() {
      router.refresh()
    },
  })

  function handleAdd() {
    if (!newStageName.trim()) return
    executeAdd({ roleId, name: newStageName.trim() })
  }

  return (
    <div className="flex flex-col gap-block">
      <div className="flex flex-col gap-1">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex items-center justify-between rounded-md px-2 py-1 text-label"
          >
            <span className="text-muted-foreground">
              {stage.name}
              {stage.type !== "CUSTOM" && (
                <span className="ml-1 text-caption text-muted-foreground/60">
                  (system)
                </span>
              )}
            </span>
            {stage.type === "CUSTOM" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => executeRemove({ stageId: stage.id })}
                tooltip="Remove stage"
              >
                <XIcon className="size-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-element">
        <Input
          type="text"
          placeholder="New stage name"
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          className="h-8"
        />
        <Button
          variant="outline"
          size="sm"
          leftSection={<PlusIcon />}
          onClick={handleAdd}
          loading={isAdding}
        >
          Add
        </Button>
      </div>
    </div>
  )
}
