"use client"

import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useState } from "react"
import { addPipelineStage } from "@/actions/productions/add-pipeline-stage"
import { removePipelineStage } from "@/actions/productions/remove-pipeline-stage"
import { reorderRoleStages } from "@/actions/productions/reorder-role-stages"
import {
  type StageData,
  StagesEditor,
} from "@/components/productions/default-stages-editor"

interface Props {
  roleId: string
  stages: StageData[]
}

export function RoleStagesEditor({ roleId, stages }: Props) {
  const router = useRouter()
  const [localStages, setLocalStages] = useState(stages)

  useEffect(() => {
    setLocalStages(stages)
    setRemovingStageId(null)
  }, [stages])

  const { execute: executeReorder } = useAction(reorderRoleStages, {
    onError() {
      router.refresh()
    },
  })

  const { execute: executeAdd, isPending: isAdding } = useAction(
    addPipelineStage,
    {
      onSuccess() {
        router.refresh()
      },
    },
  )

  const [removingStageId, setRemovingStageId] = useState<string | null>(null)

  const { execute: executeRemove } = useAction(removePipelineStage, {
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
    executeAdd({ roleId, name })
  }

  function handleRemove(stageId: string) {
    setRemovingStageId(stageId)
    setLocalStages((prev) => prev.filter((s) => s.id !== stageId))
    executeRemove({ stageId })
  }

  function handleReorder(reordered: StageData[]) {
    setLocalStages(reordered)
    const customIds = reordered
      .filter((s) => s.type === "CUSTOM")
      .map((s) => s.id)
    executeReorder({ roleId, stageIds: customIds })
  }

  return (
    <StagesEditor
      stages={localStages}
      onAdd={handleAdd}
      onRemove={handleRemove}
      onReorder={handleReorder}
      isAdding={isAdding}
      removingStageId={removingStageId}
    />
  )
}
