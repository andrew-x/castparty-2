"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { secureActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Feedback } from "@/lib/db/schema"
import { createFeedbackActionSchema } from "@/lib/schemas/feedback"
import type { CustomForm, CustomFormResponse } from "@/lib/types"
import { generateId } from "@/lib/util"

export const createFeedback = secureActionClient
  .metadata({ action: "create-feedback" })
  .inputSchema(createFeedbackActionSchema)
  .action(
    async ({
      parsedInput: { submissionId, stageId, rating, notes, answers },
      ctx: { user },
    }) => {
      // Load submission with role + production to verify ownership
      const submission = await db.query.Submission.findFirst({
        where: (s) => eq(s.id, submissionId),
        columns: { id: true, roleId: true },
        with: {
          role: {
            columns: { id: true, feedbackFormFields: true },
            with: {
              production: {
                columns: {
                  organizationId: true,
                  feedbackFormFields: true,
                },
              },
            },
          },
        },
      })

      if (!submission) {
        throw new Error("Submission not found.")
      }

      if (
        submission.role.production.organizationId !== user.activeOrganizationId
      ) {
        throw new Error("You don't have access to this submission.")
      }

      // Verify stageId belongs to the same role
      const stage = await db.query.PipelineStage.findFirst({
        where: (s) => and(eq(s.id, stageId), eq(s.roleId, submission.roleId)),
        columns: { id: true },
      })
      if (!stage) {
        throw new Error("Invalid stage for this role.")
      }

      // Resolve feedback form fields: role-level if non-empty, else production-level
      const feedbackFormFields: CustomForm[] =
        submission.role.feedbackFormFields.length > 0
          ? submission.role.feedbackFormFields
          : submission.role.production.feedbackFormFields

      // Validate required fields
      for (const field of feedbackFormFields) {
        if (!field.required) continue
        const value = answers[field.id]
        if (field.type === "TOGGLE") {
          if (value !== "true") throw new Error(`${field.label} is required.`)
        } else if (!value || !value.trim()) {
          throw new Error(`${field.label} is required.`)
        }
      }

      // Transform flat answers to CustomFormResponse[]
      const formResponses: CustomFormResponse[] = feedbackFormFields
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

      await db.insert(Feedback).values({
        id: generateId("fb"),
        submissionId,
        submittedByUserId: user.id,
        stageId,
        rating,
        notes: notes ?? "",
        formFields: feedbackFormFields,
        answers: formResponses,
      })

      revalidatePath("/", "layout")
      return { success: true }
    },
  )
