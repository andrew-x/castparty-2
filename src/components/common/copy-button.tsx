"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/common/button"

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

  const label = copied ? "Copied" : "Copy link"

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      aria-label={label}
      tooltip={label}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}
