"use client"

import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/common/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/common/tooltip"
import { cn } from "@/lib/util"

interface Props {
  url: string
  href: string
}

export function PreviewLinkButtons({ url, href }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy link"}
              className={cn(
                "rounded-r-none border-none",
                copied && "text-success",
              )}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
            <Link
              href={href}
              target="_blank"
              aria-label="Open audition page"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-r-md border-l transition-colors hover:bg-accent [&_svg]:size-4"
            >
              <ExternalLinkIcon />
            </Link>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <span className="font-mono text-caption">{url}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
