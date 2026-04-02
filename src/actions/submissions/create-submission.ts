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
        videoUrls,
        unionStatus,
        representation,
        headshots,
        resume,
        customFieldFiles,
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
      if (sfc.video === "required" && videoUrls.length === 0) {
        throw new Error("At least one video link is required.")
      }
      // Validate required custom fields
      const formFields = production.submissionFormFields ?? []
      for (const field of formFields) {
        if (!field.required) continue
        if (field.type === "IMAGE" || field.type === "DOCUMENT") {
          const files = customFieldFiles[field.id]
          if (!files || files.length === 0) {
            throw new Error(`${field.label} is required.`)
          }
        } else if (field.type === "TOGGLE") {
          const value = answers[field.id]
          if (value !== "true") throw new Error(`${field.label} is required.`)
        } else if (field.type === "CHECKBOX_GROUP") {
          const value = answers[field.id]
          const selected = value?.split(",").filter((v) => v.trim().length > 0)
          if (!selected?.length) throw new Error(`${field.label} is required.`)
        } else if (!answers[field.id]?.trim()) {
          throw new Error(`${field.label} is required.`)
        }
      }

      // Move custom field files from temp/ to permanent R2 storage
      type MovedCustomFile = {
        moved: { url: string; key: string; path: string }
        meta: { filename: string; contentType: string; size: number }
      }
      const movedCustomFieldFiles: Record<string, MovedCustomFile[]> = {}

      for (const [fieldId, files] of Object.entries(customFieldFiles)) {
        if (!files || files.length === 0) continue

        const tempPrefix = `${r2Root}/temp/custom-fields/`
        for (const file of files) {
          if (!file.key.startsWith(tempPrefix)) {
            throw new Error("Invalid file key.")
          }
        }

        await Promise.all(
          files.map(async (f) => {
            const exists = await checkFileExists(f.key)
            if (!exists)
              throw new Error(
                "Custom field upload not found. Try uploading again.",
              )
          }),
        )

        movedCustomFieldFiles[fieldId] = await Promise.all(
          files.map(async (file) => {
            const moved = await moveFileByKey(file.key, "custom-fields")
            return {
              moved,
              meta: {
                filename: file.filename,
                contentType: file.contentType,
                size: file.size,
              },
            }
          }),
        )
      }

      // Transform flat answers to CustomFormResponse[]
      const formResponses: CustomFormResponse[] = formFields
        .filter(
          (field) =>
            field.id in answers ||
            field.type === "IMAGE" ||
            field.type === "DOCUMENT",
        )
        .map((field) => {
          switch (field.type) {
            case "TEXT":
            case "TEXTAREA":
              return {
                fieldId: field.id,
                textValue: answers[field.id] ?? "",
                booleanValue: null,
                optionValues: null,
                fileValues: null,
              }
            case "SELECT": {
              const value = answers[field.id] ?? ""
              return {
                fieldId: field.id,
                textValue: null,
                booleanValue: null,
                optionValues: value ? [value] : [],
                fileValues: null,
              }
            }
            case "CHECKBOX_GROUP": {
              const value = answers[field.id] ?? ""
              return {
                fieldId: field.id,
                textValue: null,
                booleanValue: null,
                optionValues: value ? value.split(",") : [],
                fileValues: null,
              }
            }
            case "TOGGLE":
              return {
                fieldId: field.id,
                textValue: null,
                booleanValue: (answers[field.id] ?? "") === "true",
                optionValues: null,
                fileValues: null,
              }
            case "IMAGE":
            case "DOCUMENT": {
              const movedFiles = movedCustomFieldFiles[field.id]
              return {
                fieldId: field.id,
                textValue: null,
                booleanValue: null,
                optionValues: null,
                fileValues: movedFiles?.map((f) => f.moved.url) ?? null,
              }
            }
            default:
              return {
                fieldId: field.id,
                textValue: answers[field.id] ?? "",
                booleanValue: null,
                optionValues: null,
                fileValues: null,
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
            videoUrls,
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

        // Insert File records for custom field uploads
        for (const [fieldId, files] of Object.entries(movedCustomFieldFiles)) {
          if (!files || files.length === 0) continue
          await tx.insert(File).values(
            submissionIds.flatMap((subId) =>
              files.map(({ moved, meta }, index) => ({
                id: generateId("file"),
                submissionId: subId,
                formFieldId: fieldId,
                type: "CUSTOM_FIELD" as const,
                url: moved.url,
                key: moved.key,
                path: moved.path,
                filename: meta.filename,
                contentType: meta.contentType,
                size: meta.size,
                order: index,
              })),
            ),
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
