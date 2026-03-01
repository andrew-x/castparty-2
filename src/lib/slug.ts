import { createId } from "@paralleldrive/cuid2"
import { and, eq, type SQL } from "drizzle-orm"
import type { PgColumn, PgTableWithColumns } from "drizzle-orm/pg-core"
import db from "@/lib/db/db"

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const RESERVED_SLUGS = new Set([
  "new",
  "create",
  "edit",
  "delete",
  "settings",
  "admin",
  "api",
  "submit",
  "auth",
  "home",
])

const MIN_LENGTH = 3
const MAX_LENGTH = 60

/**
 * Generate a slug from a human-readable name.
 * Lowercases, replaces non-alphanumeric with hyphens, strips edges,
 * caps at 40 chars, and appends an 8-char CUID suffix.
 */
export function nameToSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)

  const suffix = createId().slice(0, 8)
  return `${base}-${suffix}`
}

/**
 * Validate a user-provided slug string.
 * Returns an error message or null if valid.
 */
export function validateSlug(slug: string): string | null {
  if (slug.length < MIN_LENGTH)
    return `URL ID must be at least ${MIN_LENGTH} characters.`
  if (slug.length > MAX_LENGTH)
    return `URL ID must be at most ${MAX_LENGTH} characters.`
  if (!SLUG_REGEX.test(slug))
    return "URL ID can only contain lowercase letters, numbers, and hyphens."
  if (/^\d+$/.test(slug)) return "URL ID cannot be purely numeric."
  if (RESERVED_SLUGS.has(slug)) return "This URL ID is reserved."
  return null
}

/**
 * Generate a unique slug within a scope.
 * Tries the generated slug; on collision, regenerates with a new CUID suffix.
 */
export async function generateUniqueSlug(
  baseName: string,
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle table types are complex
  table: PgTableWithColumns<any>,
  slugColumn: PgColumn,
  scopeFilter?: SQL,
): Promise<string> {
  const base = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = createId().slice(0, 8)
    const candidate = `${base}-${suffix}`

    const slugMatch = eq(slugColumn, candidate)
    const whereClause = scopeFilter ? and(slugMatch, scopeFilter) : slugMatch

    const existing = await db
      .select({ slug: slugColumn })
      .from(table)
      .where(whereClause)
      .limit(1)

    if (existing.length === 0) return candidate
  }

  // Extremely unlikely fallback: use full CUID
  return `${base}-${createId()}`
}

export { RESERVED_SLUGS }
