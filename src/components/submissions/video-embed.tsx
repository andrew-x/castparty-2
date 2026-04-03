"use client"

import { AlertTriangleIcon, ExternalLinkIcon } from "lucide-react"
import { cn } from "@/lib/util"
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
  /** Use "sm" in space-constrained contexts like the submission drawer. */
  size?: "default" | "sm"
  /** Show "open in new tab" link and troubleshooting hint for the production team. */
  showHint?: boolean
}

export function VideoEmbed({
  url,
  className,
  size = "default",
  showHint,
}: Props) {
  const isHttpUrl = /^https?:\/\//i.test(url)
  const { platform, embedUrl } = isHttpUrl
    ? getVideoEmbedInfo(url)
    : { platform: "unknown" as const, embedUrl: null }
  const label = PLATFORM_LABELS[platform]

  const openLink = (
    <a
      href={isHttpUrl ? url : "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-element text-caption text-muted-foreground transition-colors hover:text-foreground"
    >
      <ExternalLinkIcon className="size-3 shrink-0" />
      <span>Open in new tab</span>
    </a>
  )

  if (embedUrl) {
    return (
      <div className={className}>
        <p className="mb-1 text-caption text-muted-foreground">{label}</p>
        <div
          className={cn(
            "overflow-hidden rounded-lg border border-border",
            size === "sm" ? "aspect-[16/10] max-h-80" : "aspect-video",
          )}
        >
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
        {showHint && (
          <div className="mt-element flex flex-col gap-element">
            {openLink}
            <p className="text-caption text-muted-foreground">
              Can't play the video? Ask the candidate to check their sharing
              settings.
            </p>
          </div>
        )}
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
          Preview not available. Open the link directly or check that sharing
          settings allow viewing.
        </span>
      </a>
    </div>
  )
}
