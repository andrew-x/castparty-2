"use server"

import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { generateId } from "@/lib/util"

export const createRole = secureActionClient
  .metadata({ action: "create-role" })
  .inputSchema(
    z.object({
      productionId: z.string().min(1),
      name: z.string().trim().min(1, "Role name is required.").max(100),
      description: z.string().trim().optional(),
    }),
  )
  .action(async ({ parsedInput: { productionId, name, description } }) => {
    const id = generateId("role")

    await db.insert(Role).values({
      id,
      productionId,
      name,
      description: description || null,
    })

    return { id }
  })
