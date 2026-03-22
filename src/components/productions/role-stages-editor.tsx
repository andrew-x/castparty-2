"use client"

import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useState } from "react"
import { addPipelineStage } from "@/actions/productions/add-pipeline-stage"
import { removePipelineStage } from "@/actions/productions/remove-pipeline-stage"
import { reorderRoleStages } from "@/actions/productions/reorder-role-stages"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/common/alert-dialog"
import {
  type StageData,
  StagesEditor,
} from "@/components/productions/default-stages-editor"

interface Props {
  roleId: string
  stages: StageData[]
  submissionCounts?: Record<string, number>
}

export function RoleStagesEditor({ roleId, stages, submissionCounts }: Props) {
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
  const [confirmStage, setConfirmStage] = useState<{
    id: string
    feedbackCount: number
  } | null>(null)

  const { execute: executeRemove } = useAction(removePipelineStage, {
    onSuccess({ data }) {
      if (data?.confirmRequired && removingStageId) {
        const stageId = removingStageId
        setRemovingStageId(null)
        // Restore the optimistically removed stage
        setLocalStages(stages)
        setConfirmStage({
          id: stageId,
          feedbackCount: data.feedbackCount ?? 0,
        })
        return
      }
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

  function handleConfirmRemove() {
    if (!confirmStage) return
    setRemovingStageId(confirmStage.id)
    setLocalStages((prev) => prev.filter((s) => s.id !== confirmStage.id))
    executeRemove({ stageId: confirmStage.id, force: true })
    setConfirmStage(null)
  }

  function handleReorder(reordered: StageData[]) {
    setLocalStages(reordered)
    const customIds = reordered
      .filter((s) => s.type === "CUSTOM")
      .map((s) => s.id)
    executeReorder({ roleId, stageIds: customIds })
  }

  return (
    <>
      <StagesEditor
        stages={localStages}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onReorder={handleReorder}
        isAdding={isAdding}
        removingStageId={removingStageId}
        submissionCounts={submissionCounts}
      />

      <AlertDialog
        open={!!confirmStage}
        onOpenChange={(open) => {
          if (!open) setConfirmStage(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete stage</AlertDialogTitle>
            <AlertDialogDescription>
              This stage has {confirmStage?.feedbackCount} feedback{" "}
              {confirmStage?.feedbackCount === 1 ? "entry" : "entries"}. All
              feedback submitted for this stage will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmRemove}
            >
              Delete stage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
