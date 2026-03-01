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
      email: z.string().trim().email("Enter a valid email."),
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

      return db.transaction(async (tx) => {
        // Look up existing candidate in this org by email
        const existing = await tx.query.Candidate.findFirst({
          where: (c) => and(eq(c.organizationId, orgId), eq(c.email, email)),
          columns: { id: true },
        })

        let candidateId: string

        if (existing) {
          candidateId = existing.id
        } else {
          candidateId = generateId("cand")
          await tx.insert(Candidate).values({
            id: candidateId,
            organizationId: orgId,
            firstName,
            lastName,
            email,
            phone: phone ?? null,
          })
        }

        const submissionId = generateId("sub")

        await tx.insert(Submission).values({
          id: submissionId,
          productionId,
          roleId,
          candidateId,
          firstName,
          lastName,
          email,
          phone: phone ?? null,
        })

        return { id: submissionId }
      })
    },
  )
