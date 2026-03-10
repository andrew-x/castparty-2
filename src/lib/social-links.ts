type Platform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "vimeo"
  | "x"
  | "facebook"
  | "linkedin"
  | "spotify"

interface PlatformMeta {
  name: string
}

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  instagram: { name: "Instagram" },
  tiktok: { name: "TikTok" },
  youtube: { name: "YouTube" },
  vimeo: { name: "Vimeo" },
  x: { name: "X" },
  facebook: { name: "Facebook" },
  linkedin: { name: "LinkedIn" },
  spotify: { name: "Spotify" },
}

const HOST_MAP: [string[], Platform][] = [
  [["instagram.com", "www.instagram.com"], "instagram"],
  [["tiktok.com", "www.tiktok.com"], "tiktok"],
  [["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"], "youtube"],
  [["vimeo.com", "www.vimeo.com", "player.vimeo.com"], "vimeo"],
  [["twitter.com", "www.twitter.com", "x.com", "www.x.com"], "x"],
  [["facebook.com", "www.facebook.com", "m.facebook.com"], "facebook"],
  [["linkedin.com", "www.linkedin.com"], "linkedin"],
  [["open.spotify.com", "spotify.com"], "spotify"],
]

export function detectPlatform(url: string): Platform | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    for (const [hosts, platform] of HOST_MAP) {
      if (hosts.includes(hostname)) return platform
    }
  } catch {
    // invalid URL
  }
  return null
}

export function prettifyUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const display = `${parsed.hostname}${parsed.pathname}`
    return display.replace(/\/$/, "")
  } catch {
    return url
  }
}
