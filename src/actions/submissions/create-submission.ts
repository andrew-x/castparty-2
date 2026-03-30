"use server"

import { and, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { extractText, getDocumentProxy } from "unpdf"
import { sendSubmissionEmail } from "@/actions/submissions/send-submission-email"
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
        roleIds,
        firstName,
        lastName,
        email,
        phone,
        location,
        answers,
        links,
        unionStatus,
        representation,
        headshots,
        resume,
      },
    }) => {
      // Validate all roles exist and belong to the production
      const roles = await db.query.Role.findMany({
        where: (r) =>
          and(eq(r.productionId, productionId), inArray(r.id, roleIds)),
        columns: {
          id: true,
          productionId: true,
          status: true,
        },
      })

      if (roles.length !== roleIds.length) {
        throw new Error("One or more roles are not available for submissions.")
      }

      for (const role of roles) {
        if (role.status !== "open") {
          throw new Error("One or more roles are not open for auditions.")
        }
      }

      // Validate production ownership and fetch config
      const production = await db.query.Production.findFirst({
        where: (p) => and(eq(p.id, productionId), eq(p.organizationId, orgId)),
        columns: {
          id: true,
          status: true,
          submissionFormFields: true,
          systemFieldConfig: true,
          emailTemplates: true,
        },
      })

      if (!production) {
        throw new Error("This production is not available for submissions.")
      }

      if (production.status !== "open") {
        throw new Error("This production is not accepting auditions right now.")
      }

      // Resolve the APPLIED stage for this production
      const appliedStage = await db.query.PipelineStage.findFirst({
        where: (s) =>
          and(eq(s.productionId, productionId), eq(s.type, "APPLIED")),
        columns: { id: true },
      })

      if (!appliedStage) {
        throw new Error("Pipeline is not configured for this production.")
      }

      // Validate required system fields
      const sfc = {
        ...DEFAULT_SYSTEM_FIELD_CONFIG,
        ...production.systemFieldConfig,
      }
      if (sfc.phone === "required" && !phone?.trim()) {
        throw new Error("Phone number is required.")
      }
      if (sfc.location === "required" && !location?.trim()) {
        throw new Error("Location is required.")
      }
      if (sfc.headshots === "required" && headshots.length === 0) {
        throw new Error("At least one headshot is required.")
      }
      if (sfc.resume === "required" && !resume) {
        throw new Error("Resume is required.")
      }
      // Validate required custom fields
      const formFields = production.submissionFormFields ?? []
      for (const field of formFields) {
        if (!field.required) continue
        const value = answers[field.id]
        if (field.type === "TOGGLE") {
          if (value !== "true") throw new Error(`${field.label} is required.`)
        } else if (field.type === "CHECKBOX_GROUP") {
          const selected = value?.split(",").filter((v) => v.trim().length > 0)
          if (!selected?.length) throw new Error(`${field.label} is required.`)
        } else if (!value?.trim()) {
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

      // Generate one submission ID per role
      const submissionIds = roleIds.map(() => generateId("sub"))

      // Move files from temp/ to permanent R2 storage before the transaction
      // (R2 operations can't participate in a Postgres transaction)
      type MovedFile = { url: string; key: string; path: string }
      let movedHeadshots: {
        moved: MovedFile
        headshot: (typeof headshots)[number]
        index: number
      }[] = []
      let movedResume: MovedFile | undefined

      if (headshots.length > 0) {
        const tempPrefix = `${r2Root}/temp/headshots/`
        for (const headshot of headshots) {
          if (!headshot.key.startsWith(tempPrefix)) {
            throw new Error("Invalid file key.")
          }
        }

        await Promise.all(
          headshots.map(async (h) => {
            const exists = await checkFileExists(h.key)
            if (!exists)
              throw new Error("Headshot upload not found. Try uploading again.")
          }),
        )

        movedHeadshots = await Promise.all(
          headshots.map(async (headshot, index) => {
            const moved = await moveFileByKey(headshot.key, "headshots")
            return { moved, headshot, index }
          }),
        )
      }

      if (resume) {
        const tempPrefix = `${r2Root}/temp/resumes/`
        if (!resume.key.startsWith(tempPrefix)) {
          throw new Error("Invalid file key.")
        }

        const resumeExists = await checkFileExists(resume.key)
        if (!resumeExists)
          throw new Error("Resume upload not found. Try uploading again.")

        movedResume = await moveFileByKey(resume.key, "resumes")
      }

      // All DB writes in a single atomic transaction
      await db.transaction(async (tx) => {
        const [candidate] = await tx
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

        await tx.insert(Submission).values(
          roleIds.map((roleId, i) => ({
            id: submissionIds[i],
            productionId,
            roleId,
            candidateId: candidate.id,
            stageId: appliedStage.id,
            firstName,
            lastName,
            email,
            phone: phone ?? "",
            location: location || "",
            answers: formResponses,
            links,
            unionStatus,
            representation,
          })),
        )

        if (movedHeadshots.length > 0) {
          await tx.insert(File).values(
            submissionIds.flatMap((subId) =>
              movedHeadshots.map(({ moved, headshot, index }) => ({
                id: generateId("file"),
                submissionId: subId,
                type: "HEADSHOT" as const,
                url: moved.url,
                key: moved.key,
                path: moved.path,
                filename: headshot.filename,
                contentType: headshot.contentType,
                size: headshot.size,
                order: index,
              })),
            ),
          )
        }

        if (movedResume && resume) {
          await tx.insert(File).values(
            submissionIds.map((subId) => ({
              id: generateId("file"),
              submissionId: subId,
              type: "RESUME" as const,
              url: movedResume.url,
              key: movedResume.key,
              path: movedResume.path,
              filename: resume.filename,
              contentType: resume.contentType,
              size: resume.size,
              order: 0,
            })),
          )
        }
      })

      // Parse PDF text from the uploaded resume (best-effort)
      if (movedResume) {
        try {
          const response = await fetch(movedResume.url)
          const buffer = await response.arrayBuffer()
          const pdf = await getDocumentProxy(new Uint8Array(buffer))
          const { text } = await extractText(pdf, { mergePages: true })
          if (text.trim()) {
            await db
              .update(Submission)
              .set({ resumeText: text.trim() })
              .where(inArray(Submission.id, submissionIds))
          }
        } catch (err) {
          logger.error("PDF parsing failed", err)
        }
      }

      // Send submission received emails in parallel (fire-and-forget)
      await Promise.allSettled(
        submissionIds.map((subId) =>
          sendSubmissionEmail(subId, "submissionReceived").catch((err) =>
            logger.error("Submission received email failed", err),
          ),
        ),
      )

      revalidatePath("/", "layout")
      return { ids: submissionIds }
    },
  )
