"use server"

import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production, Role } from "@/lib/db/schema"
import { generateId } from "@/lib/util"

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required.").max(100),
  description: z.string().optional(),
})

const createProductionSchema = z.object({
  name: z.string().min(1, "Production name is required.").max(100),
  description: z.string().optional(),
  roles: z.array(roleSchema).optional(),
})

export const createProduction = secureActionClient
  .metadata({ action: "create-production" })
  .inputSchema(createProductionSchema)
  .action(
    async ({ parsedInput: { name, description, roles }, ctx: { user } }) => {
      if (!user.activeOrganizationId) {
        throw new Error("No active organization.")
      }

      const productionId = generateId("prod")

      await db.insert(Production).values({
        id: productionId,
        organizationId: user.activeOrganizationId,
        name,
        description: description || null,
      })

      if (roles?.length) {
        await db.insert(Role).values(
          roles.map((role) => ({
            id: generateId("role"),
            productionId,
            name: role.name,
            description: role.description || null,
          })),
        )
      }

      return { id: productionId }
    },
  )
