"use client"

import { PlusIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import type { updateProductionRejectReasons } from "@/actions/productions/update-production-reject-reasons"
import { Button } from "@/components/common/button"
import { Input } from "@/components/common/input"

interface Props {
  entityId: string
  reasons: string[]
  action: typeof updateProductionRejectReasons
  idField: "productionId" | "roleId"
}

export function RejectReasonsEditor({
  entityId,
  reasons,
  action,
  idField,
}: Props) {
  const router = useRouter()
  const [newReason, setNewReason] = useState("")

  const { execute, isPending } = useAction(action, {
    onSuccess() {
      router.refresh()
    },
  })

  function save(updated: string[]) {
    execute({ [idField]: entityId, rejectReasons: updated } as {
      productionId: string
      rejectReasons: string[]
    })
  }

  function handleAdd() {
    const trimmed = newReason.trim()
    if (!trimmed || reasons.includes(trimmed)) return
    save([...reasons, trimmed])
    setNewReason("")
  }

  function handleRemove(index: number) {
    save(reasons.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-group">
      <div className="flex flex-col gap-element">
        <h3 className="font-medium text-foreground text-label">
          Reject Reasons
        </h3>
        <p className="text-caption text-muted-foreground">
          Predefined reasons shown when rejecting a candidate. These can be
          customized per role.
        </p>
      </div>

      {reasons.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {reasons.map((reason, index) => (
            <li
              key={reason}
              className="flex items-center gap-element px-3 py-2"
            >
              <span className="flex-1 text-foreground text-label">
                {reason}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                tooltip="Remove reason"
                disabled={isPending}
                onClick={() => handleRemove(index)}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleAdd()
        }}
        className="flex gap-element"
      >
        <Input
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          placeholder="Add a reject reason..."
          maxLength={200}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={!newReason.trim() || isPending}
          leftSection={<PlusIcon />}
        >
          Add
        </Button>
      </form>
    </div>
  )
}
