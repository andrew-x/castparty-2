"use server"

import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production, Role } from "@/lib/db/schema"
import { generateUniqueSlug, nameToSlug } from "@/lib/slug"
import { generateId } from "@/lib/util"

const roleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim().optional(),
})

const createProductionSchema = z.object({
  name: z.string().trim().min(1, "Production name is required.").max(100),
  description: z.string().trim().optional(),
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
      const productionSlug = await generateUniqueSlug(
        name,
        Production,
        Production.slug,
        eq(Production.organizationId, user.activeOrganizationId),
      )

      await db.insert(Production).values({
        id: productionId,
        organizationId: user.activeOrganizationId,
        name,
        slug: productionSlug,
        description: description || null,
      })

      if (roles?.length) {
        // New production has no existing roles, so generate slugs in memory
        const usedSlugs = new Set<string>()
        const roleValues = roles.map((role) => {
          let slug = nameToSlug(role.name)
          let counter = 2
          while (usedSlugs.has(slug)) {
            slug = `${nameToSlug(role.name)}-${counter}`
            counter++
          }
          usedSlugs.add(slug)
          return {
            id: generateId("role"),
            productionId,
            name: role.name,
            slug,
            description: role.description || null,
          }
        })

        await db.insert(Role).values(roleValues)
      }

      return { id: productionId }
    },
  )
