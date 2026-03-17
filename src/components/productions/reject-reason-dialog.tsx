"use client"

import { useState } from "react"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog"
import { Label } from "@/components/common/label"
import { RadioGroup, RadioGroupItem } from "@/components/common/radio-group"
import { Textarea } from "@/components/common/textarea"

const OTHER_VALUE = "__other__"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  reasons: string[]
  onConfirm: (reason: string) => void
}

export function RejectReasonDialog({
  open,
  onOpenChange,
  reasons,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState("")
  const [customReason, setCustomReason] = useState("")

  const isOther = selected === OTHER_VALUE
  const resolvedReason = isOther ? customReason.trim() : selected
  const canConfirm = resolvedReason.length > 0

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelected("")
      setCustomReason("")
    }
    onOpenChange(nextOpen)
  }

  function handleConfirm() {
    if (!canConfirm) return
    onConfirm(resolvedReason)
    setSelected("")
    setCustomReason("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Candidate</DialogTitle>
          <DialogDescription>
            Select a reason for rejecting this candidate.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={selected} onValueChange={setSelected}>
          {reasons.map((reason, index) => (
            <div key={reason} className="flex items-center gap-2">
              <RadioGroupItem value={reason} id={`reason-${index}`} />
              <Label htmlFor={`reason-${index}`} className="cursor-pointer">
                {reason}
              </Label>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <RadioGroupItem value={OTHER_VALUE} id="reason-other" />
            <Label htmlFor="reason-other" className="cursor-pointer">
              Other
            </Label>
          </div>
        </RadioGroup>

        {isOther && (
          <Textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Enter a custom reason..."
            maxLength={500}
            autoFocus
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
