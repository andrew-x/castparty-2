"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { adminActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { organization } from "@/lib/db/schema"

export const deleteOrganizationAction = adminActionClient
  .metadata({ action: "delete-organization" })
  .inputSchema(z.object({ organizationId: z.string() }))
  .action(async ({ parsedInput: { organizationId } }) => {
    await db.delete(organization).where(eq(organization.id, organizationId))
    revalidatePath("/", "layout")
    return { success: true }
  })
