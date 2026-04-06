import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"

import * as schema from "@/lib/db/schema"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

function createDb() {
  const pool = new Pool({ connectionString: databaseUrl })
  return drizzle({ schema, client: pool, casing: "snake_case" })
}

const globalForDrizzle = global as unknown as {
  db: ReturnType<typeof createDb>
}
const db = globalForDrizzle.db ?? createDb()

if (process.env.NODE_ENV !== "production") globalForDrizzle.db = db

export default db
