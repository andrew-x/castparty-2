"use client"

import { LinkIcon } from "lucide-react"
import { Button } from "@/components/common/button"
import { CopyButton } from "@/components/common/copy-button"

interface Props {
  title: string
  description: string
  url: string
  href: string
}

export function ShareLink({ title, description, url, href }: Props) {
  return (
    <div className="flex flex-col gap-group pt-block">
      <div className="flex flex-col gap-element">
        <p className="font-medium text-foreground text-label">{title}</p>
        <p className="text-caption text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-center gap-element rounded-md border bg-muted px-group py-element">
        <p className="flex-1 break-all font-mono text-caption text-foreground">
          {url}
        </p>
        <CopyButton value={url} />
        <Button
          href={href}
          variant="ghost"
          size="sm"
          leftSection={<LinkIcon />}
        >
          View page
        </Button>
      </div>
    </div>
  )
}
