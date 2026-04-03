"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/common/button"
import { cn } from "@/lib/util"

interface Props {
  html: string
}

export function CollapsibleDescription({ html }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isClamped, setIsClamped] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    // Content renders with line-clamp-3 applied. If scrollHeight exceeds
    // clientHeight, the text overflows the clamp and needs a toggle.
    setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [])

  return (
    <div>
      <div
        ref={contentRef}
        className={cn(
          "prose-description text-body text-muted-foreground",
          !isExpanded && "line-clamp-3",
        )}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitize-html allowlist
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isClamped && (
        <Button
          variant="link"
          className="mt-1 h-auto p-0 text-caption"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  )
}
