/**
 * Client-safe slug generator (no server dependencies).
 * Produces a human-readable base slug without a CUID suffix.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}
