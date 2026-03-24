"use client"

import {
  EllipsisVerticalIcon,
  PencilIcon,
  UserRoundPlusIcon,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/common/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/popover"

interface Props {
  onEdit: () => void
  onConsiderForRole: () => void
}

export function SubmissionActionsMenu({ onEdit, onConsiderForRole }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon-sm" tooltip="Actions">
          <EllipsisVerticalIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          leftSection={<PencilIcon />}
          onClick={() => {
            setOpen(false)
            onEdit()
          }}
        >
          Edit submission
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          leftSection={<UserRoundPlusIcon />}
          onClick={() => {
            setOpen(false)
            onConsiderForRole()
          }}
        >
          Consider for another role
        </Button>
      </PopoverContent>
    </Popover>
  )
}
