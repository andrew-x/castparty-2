import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "@/lib/db/schema"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(databaseUrl)
const db = drizzle({
  schema,
  client: sql,
  casing: "snake_case",
})

const globalForDrizzle = global as unknown as { db: typeof db }

if (process.env.NODE_ENV !== "production") globalForDrizzle.db = db

export default db
