"use server"

import { and, eq } from "drizzle-orm"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Production } from "@/lib/db/schema"
import { addProductionFormFieldSchema } from "@/lib/schemas/form-fields"
import type { CustomForm } from "@/lib/types"
import { generateId } from "@/lib/util"

export const addProductionFormField = secureActionClient
  .metadata({ action: "add-production-form-field" })
  .inputSchema(addProductionFormFieldSchema)
  .action(
    async ({ parsedInput: { productionId, type, label }, ctx: { user } }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: { id: true, formFields: true },
      })
      if (!production) throw new Error("Production not found.")

      const newField: CustomForm = {
        id: generateId("ff"),
        type,
        label,
        description: "",
        required: false,
        options: [],
      }

      await db
        .update(Production)
        .set({ formFields: [...production.formFields, newField] })
        .where(eq(Production.id, productionId))

      return { id: newField.id }
    },
  )
