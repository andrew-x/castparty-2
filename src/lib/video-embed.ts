export interface VideoEmbedInfo {
  platform: "youtube" | "vimeo" | "google-drive" | "dropbox" | "unknown"
  embedUrl: string | null
}

export function getVideoEmbedInfo(rawUrl: string): VideoEmbedInfo {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { platform: "unknown", embedUrl: null }
  }

  const host = parsed.hostname.replace(/^www\./, "")
  const pathname = parsed.pathname.replace(/\/$/, "") // strip trailing slash

  // --- YouTube ---
  if (host === "youtube.com" || host === "youtu.be") {
    let videoId: string | null = null

    if (host === "youtu.be") {
      // https://youtu.be/{id}
      videoId = pathname.slice(1) || null
    } else if (pathname === "/watch") {
      // https://www.youtube.com/watch?v={id}
      videoId = parsed.searchParams.get("v")
    } else {
      // /shorts/{id}, /embed/{id}
      const match = pathname.match(/^\/(shorts|embed)\/([^/?#]+)/)
      if (match) videoId = match[2]
    }

    if (videoId) {
      return {
        platform: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }
    }
  }

  // --- Vimeo ---
  if (host === "vimeo.com") {
    // https://vimeo.com/{numeric-id}
    const match = pathname.match(/^\/(\d+)/)
    if (match) {
      return {
        platform: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${match[1]}`,
      }
    }
  }

  // --- Google Drive ---
  if (host === "drive.google.com") {
    // https://drive.google.com/file/d/{id}/...
    const match = pathname.match(/^\/file\/d\/([^/]+)/)
    if (match) {
      return {
        platform: "google-drive",
        embedUrl: `https://drive.google.com/file/d/${match[1]}/preview`,
      }
    }
  }

  // --- Dropbox ---
  if (host === "dropbox.com" || host === "www.dropbox.com") {
    // Replace dl=0 param or ?dl=0 suffix with raw=1 so the file is served directly
    let embedUrl = rawUrl
      .replace(/[?&]dl=0(&|$)/, (_, suffix) => (suffix ? "?" : ""))
      .replace(/\?$/, "")

    // Append raw=1 — preserve existing query params if any remain
    const separator = embedUrl.includes("?") ? "&" : "?"
    embedUrl = `${embedUrl}${separator}raw=1`

    return { platform: "dropbox", embedUrl }
  }

  return { platform: "unknown", embedUrl: null }
}
