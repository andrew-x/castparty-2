"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { extractText, getDocumentProxy } from "unpdf"
import { publicActionClient } from "@/lib/action"
import db from "@/lib/db/db"
import { Candidate, File, Submission } from "@/lib/db/schema"
import logger from "@/lib/logger"
import { checkFileExists, moveFileByKey, r2Root } from "@/lib/r2"
import { submissionActionSchema } from "@/lib/schemas/submission"
import type { CustomFormResponse } from "@/lib/types"
import { DEFAULT_SYSTEM_FIELD_CONFIG } from "@/lib/types"
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
        location,
        answers,
        links,
        headshots,
        resume,
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
          submissionFormFields: true,
          systemFieldConfig: true,
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

      // Validate required system fields
      const sfc = role.systemFieldConfig ?? DEFAULT_SYSTEM_FIELD_CONFIG
      if (sfc.phone === "required" && (!phone || !phone.trim())) {
        throw new Error("Phone number is required.")
      }
      if (sfc.location === "required" && (!location || !location.trim())) {
        throw new Error("Location is required.")
      }
      if (sfc.headshots === "required" && headshots.length === 0) {
        throw new Error("At least one headshot is required.")
      }
      if (sfc.resume === "required" && !resume) {
        throw new Error("Resume is required.")
      }
      if (sfc.links === "required" && (!links || links.length === 0)) {
        throw new Error("At least one link is required.")
      }

      // Validate required custom fields
      const formFields = role.submissionFormFields ?? []
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

      // Upsert candidate — atomic insert-or-update by org + email
      const [candidate] = await db
        .insert(Candidate)
        .values({
          id: generateId("cand"),
          organizationId: orgId,
          firstName,
          lastName,
          email,
          phone: phone ?? "",
          location: location ?? "",
        })
        .onConflictDoUpdate({
          target: [Candidate.organizationId, Candidate.email],
          set: {
            firstName,
            lastName,
            phone: phone ?? "",
            location: location ?? "",
          },
        })
        .returning({ id: Candidate.id })

      const candidateId = candidate.id

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
        location: location || "",
        answers: formResponses,
        links,
      })

      // Move headshots from temp/ to permanent prefix and create File records
      if (headshots.length > 0) {
        const tempPrefix = `${r2Root}/temp/headshots/`
        for (const headshot of headshots) {
          if (!headshot.key.startsWith(tempPrefix)) {
            throw new Error("Invalid file key.")
          }
        }

        // Verify all temp files exist before moving
        for (const headshot of headshots) {
          const exists = await checkFileExists(headshot.key)
          if (!exists)
            throw new Error("Headshot upload not found. Try uploading again.")
        }

        const fileRecords = await Promise.all(
          headshots.map(async (headshot, index) => {
            const moved = await moveFileByKey(headshot.key, "headshots")
            return {
              id: generateId("file"),
              submissionId,
              type: "HEADSHOT" as const,
              url: moved.url,
              key: moved.key,
              path: moved.path,
              filename: headshot.filename,
              contentType: headshot.contentType,
              size: headshot.size,
              order: index,
            }
          }),
        )

        await db.insert(File).values(fileRecords)
      }

      if (resume) {
        const tempPrefix = `${r2Root}/temp/resumes/`
        if (!resume.key.startsWith(tempPrefix)) {
          throw new Error("Invalid file key.")
        }

        const resumeExists = await checkFileExists(resume.key)
        if (!resumeExists)
          throw new Error("Resume upload not found. Try uploading again.")

        const moved = await moveFileByKey(resume.key, "resumes")

        await db.insert(File).values({
          id: generateId("file"),
          submissionId,
          type: "RESUME",
          url: moved.url,
          key: moved.key,
          path: moved.path,
          filename: resume.filename,
          contentType: resume.contentType,
          size: resume.size,
          order: 0,
        })

        // Parse PDF text from the uploaded file
        try {
          const response = await fetch(moved.url)
          const buffer = await response.arrayBuffer()
          const pdf = await getDocumentProxy(new Uint8Array(buffer))
          const { text } = await extractText(pdf, { mergePages: true })
          if (text.trim()) {
            await db
              .update(Submission)
              .set({ resumeText: text.trim() })
              .where(eq(Submission.id, submissionId))
          }
        } catch (err) {
          logger.error("PDF parsing failed", err)
          // PDF parsing is best-effort — don't fail the submission
        }
      }

      revalidatePath("/", "layout")
      return { id: submissionId }
    },
  )
