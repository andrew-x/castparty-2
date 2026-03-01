"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/common/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"

interface Props {
  value: string
}

export function CopyButton({ value }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy link"}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : "Copy link"}</TooltipContent>
    </Tooltip>
  )
}
