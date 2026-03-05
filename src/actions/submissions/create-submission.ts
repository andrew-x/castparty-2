"use server"

import { and, eq } from "drizzle-orm"
import { publicActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Candidate, Submission } from "@/lib/db/schema"
import { submissionActionSchema } from "@/lib/schemas/submission"
import type { CustomFormResponse } from "@/lib/types"
import { generateId } from "@/lib/util"

export const createSubmission = publicActionClient
  .metadata({ action: "create-submission" })
  .inputSchema(submissionActionSchema)
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
        answers,
      },
    }) => {
      // Validate the full ownership chain: role → production → org
      const role = await db.query.Role.findFirst({
        where: (r) => eq(r.id, roleId),
        with: {
          production: {
            columns: { id: true, organizationId: true, isOpen: true },
          },
        },
        columns: {
          id: true,
          productionId: true,
          isOpen: true,
          formFields: true,
        },
      })

      if (
        !role ||
        role.productionId !== productionId ||
        role.production.organizationId !== orgId
      ) {
        throw new Error("This role is not available for submissions.")
      }

      if (!role.production.isOpen) {
        throw new Error("This production is not accepting auditions right now.")
      }

      if (!role.isOpen) {
        throw new Error("This role is not open for auditions right now.")
      }

      // Resolve the APPLIED stage for this role
      const appliedStage = await db.query.PipelineStage.findFirst({
        where: (s) => and(eq(s.roleId, roleId), eq(s.type, "APPLIED")),
        columns: { id: true },
      })

      if (!appliedStage) {
        throw new Error("Pipeline is not configured for this role.")
      }

      // Validate required custom fields
      const formFields = role.formFields ?? []
      for (const field of formFields) {
        if (!field.required) continue
        const value = answers[field.id]
        if (!value || !value.trim()) {
          throw new Error(`${field.label} is required.`)
        }
      }

      // Transform flat answers to CustomFormResponse[]
      const formResponses: CustomFormResponse[] = formFields
        .filter((field) => field.id in answers)
        .map((field) => {
          const value = answers[field.id] ?? ""
          switch (field.type) {
            case "TEXT":
            case "TEXTAREA":
              return {
                fieldId: field.id,
                textValue: value,
                booleanValue: null,
                optionValues: null,
              }
            case "SELECT":
              return {
                fieldId: field.id,
                textValue: null,
                booleanValue: null,
                optionValues: value ? [value] : [],
              }
            case "CHECKBOX_GROUP":
              return {
                fieldId: field.id,
                textValue: null,
                booleanValue: null,
                optionValues: value ? value.split(",") : [],
              }
            case "TOGGLE":
              return {
                fieldId: field.id,
                textValue: null,
                booleanValue: value === "true",
                optionValues: null,
              }
            default:
              return {
                fieldId: field.id,
                textValue: value,
                booleanValue: null,
                optionValues: null,
              }
          }
        })

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
        answers: formResponses,
      })

      return { id: submissionId }
    },
  )
