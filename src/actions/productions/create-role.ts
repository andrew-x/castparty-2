"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Role } from "@/lib/db/schema"
import { generateUniqueSlug } from "@/lib/slug"
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
  .action(
    async ({
      parsedInput: { productionId, name, description },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      // Verify the production belongs to the user's organization
      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true },
      })
      if (!production) throw new Error("Production not found.")

      const id = generateId("role")
      const slug = await generateUniqueSlug(
        name,
        Role,
        Role.slug,
        eq(Role.productionId, productionId),
      )

      await db.insert(Role).values({
        id,
        productionId,
        name,
        slug,
        description: description || "",
        isOpen: true,
      })

      revalidatePath("/", "layout")
      return { id, slug }
    },
  )
