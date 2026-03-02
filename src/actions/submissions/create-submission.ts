"use server"

import { and, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { publicActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Candidate, Submission } from "@/lib/db/schema"
import { generateId } from "@/lib/util"

export const createSubmission = publicActionClient
  .metadata({ action: "create-submission" })
  .inputSchema(
    z.object({
      orgId: z.string().min(1),
      productionId: z.string().min(1),
      roleId: z.string().min(1),
      firstName: z.string().trim().min(1, "First name is required.").max(100),
      lastName: z.string().trim().min(1, "Last name is required.").max(100),
      email: z
        .string()
        .trim()
        .pipe(z.email({ error: "Enter a valid email." })),
      phone: z.string().trim().optional(),
    }),
  )
  .action(
    async ({
      parsedInput: {
        orgId,
        productionId,
        roleId,
        firstName,
        lastName,
        email,
        phone,
      },
    }) => {
      // Validate the full ownership chain: role → production → org
      const role = await db.query.Role.findFirst({
        where: (r) => eq(r.id, roleId),
        with: { production: { columns: { id: true, organizationId: true } } },
        columns: { id: true, productionId: true },
      })

      if (
        !role ||
        role.productionId !== productionId ||
        role.production.organizationId !== orgId
      ) {
        throw new Error("This role is not available for submissions.")
      }

      // Resolve the APPLIED stage for this role
      const appliedStage = await db.query.PipelineStage.findFirst({
        where: (s) => and(eq(s.roleId, roleId), eq(s.type, "APPLIED")),
        columns: { id: true },
      })

      if (!appliedStage) {
        throw new Error("Pipeline is not configured for this role.")
      }

      // Look up existing candidate in this org by email
      const existing = await db.query.Candidate.findFirst({
        where: (c) => and(eq(c.organizationId, orgId), eq(c.email, email)),
        columns: { id: true },
      })

      let candidateId: string

      if (existing) {
        candidateId = existing.id
        await db
          .update(Candidate)
          .set({ firstName, lastName, phone: phone ?? "" })
          .where(eq(Candidate.id, existing.id))
      } else {
        candidateId = generateId("cand")
        await db.insert(Candidate).values({
          id: candidateId,
          organizationId: orgId,
          firstName,
          lastName,
          email,
          phone: phone ?? "",
        })
      }

      const submissionId = generateId("sub")

      await db.insert(Submission).values({
        id: submissionId,
        productionId,
        roleId,
        candidateId,
        stageId: appliedStage.id,
        firstName,
        lastName,
        email,
        phone: phone ?? "",
      })

      return { id: submissionId }
    },
  )
