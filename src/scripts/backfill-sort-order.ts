/**
 * One-time backfill: assigns fractional-indexing sort keys to existing
 * submissions that have an empty sortOrder. Run with:
 *   bun src/scripts/backfill-sort-order.ts
 */
import "dotenv/config"
import { and, eq, ne } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { generateNKeysBetween } from "fractional-indexing"
import * as schema from "@/lib/db/schema"

const db = drizzle(process.env.DATABASE_URL!, { schema })

async function main() {
  // Find all submissions with empty sortOrder, grouped by stage
  const submissions = await db.query.Submission.findMany({
    where: (s) => eq(s.sortOrder, ""),
    columns: { id: true, productionId: true, stageId: true, createdAt: true },
    orderBy: (s, { asc }) => [
      asc(s.productionId),
      asc(s.stageId),
      asc(s.createdAt),
    ],
  })

  if (submissions.length === 0) {
    console.log("No submissions need backfill.")
    process.exit(0)
  }

  // Group by (productionId, stageId)
  const groups = new Map<string, typeof submissions>()
  for (const sub of submissions) {
    const key = `${sub.productionId}:${sub.stageId}`
    const group = groups.get(key)
    if (group) {
      group.push(sub)
    } else {
      groups.set(key, [sub])
    }
  }

  let updated = 0
  for (const [groupKey, group] of groups) {
    const [productionId, stageId] = groupKey.split(":")

    // Find the max existing real key in this group so we don't collide
    // with submissions that arrived after the schema change but before
    // this backfill ran.
    const maxExisting = await db.query.Submission.findFirst({
      where: (s) =>
        and(
          eq(s.productionId, productionId),
          eq(s.stageId, stageId),
          ne(s.sortOrder, ""),
        ),
      columns: { sortOrder: true },
      orderBy: (s, { desc }) => [desc(s.sortOrder)],
    })

    const keys = generateNKeysBetween(
      maxExisting?.sortOrder || null,
      null,
      group.length,
    )
    for (let i = 0; i < group.length; i++) {
      await db
        .update(schema.Submission)
        .set({ sortOrder: keys[i] })
        .where(eq(schema.Submission.id, group[i].id))
      updated++
    }
  }

  console.log(
    `Backfilled ${updated} submissions across ${groups.size} stage groups.`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error("Backfill failed:", err)
  process.exit(1)
})
