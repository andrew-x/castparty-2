"use server"

import { and, eq, not } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import day from "@/lib/dayjs"
import db from "@/lib/db/db"
import { Candidate } from "@/lib/db/schema"
import { updateCandidateActionSchema } from "@/lib/schemas/candidate"

export const updateCandidate = secureActionClient
  .metadata({ action: "update-candidate" })
  .inputSchema(updateCandidateActionSchema)
  .action(
    async ({
      parsedInput: { candidateId, firstName, lastName, email, phone, location },
      ctx: { user },
    }) => {
      const orgId = user.activeOrganizationId
      if (!orgId) throw new Error("No active organization.")

      const candidate = await db.query.Candidate.findFirst({
        where: (c) => and(eq(c.id, candidateId), eq(c.organizationId, orgId)),
        columns: { id: true },
      })
      if (!candidate) throw new Error("Candidate not found.")

      const conflict = await db.query.Candidate.findFirst({
        where: (c) =>
          and(
            eq(c.organizationId, orgId),
            eq(c.email, email),
            not(eq(c.id, candidateId)),
          ),
        columns: { id: true },
      })
      if (conflict)
        throw new Error("A candidate with this email already exists.")

      await db
        .update(Candidate)
        .set({
          firstName,
          lastName,
          email,
          phone: phone ?? "",
          location: location ?? "",
          updatedAt: day().toDate(),
        })
        .where(eq(Candidate.id, candidateId))

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
