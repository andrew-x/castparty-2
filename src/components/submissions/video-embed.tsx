"use client"

import { AlertTriangleIcon } from "lucide-react"
import { getVideoEmbedInfo } from "@/lib/video-embed"

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  "google-drive": "Google Drive",
  dropbox: "Dropbox",
  unknown: "Unknown",
}

interface Props {
  url: string
  className?: string
}

export function VideoEmbed({ url, className }: Props) {
  const isHttpUrl = /^https?:\/\//i.test(url)
  const { platform, embedUrl } = isHttpUrl
    ? getVideoEmbedInfo(url)
    : { platform: "unknown" as const, embedUrl: null }
  const label = PLATFORM_LABELS[platform]

  if (embedUrl) {
    return (
      <div className={className}>
        <p className="mb-1 text-caption text-muted-foreground">{label}</p>
        <div className="aspect-video overflow-hidden rounded-lg border border-border">
          <iframe
            src={embedUrl}
            className="size-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation"
            // @ts-expect-error -- credentialless is a valid HTML attribute not yet in React's types
            credentialless=""
            title={`${label} video`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="mb-1 text-caption text-muted-foreground">{label}</p>
      <a
        href={isHttpUrl ? url : "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-element rounded-md bg-muted px-3 py-2 text-label text-muted-foreground transition-colors hover:text-foreground"
      >
        <AlertTriangleIcon className="size-4 shrink-0" />
        <span>
          Preview not available — make sure this link is publicly accessible
        </span>
      </a>
    </div>
  )
}
